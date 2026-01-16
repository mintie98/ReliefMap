import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import authService from '../services/authService';
import { ICONS } from '../assets/icons';

export function useLocationDetailPanel(props) {
    const showReviewModal = ref(false);
    const { createReview, reviews: viewModelReviews, loadReviews } = useReviewViewModel();
    const router = useRouter();

    const handleAddReviewClick = () => {
        if (!authService.isAuthenticated()) {
            if (confirm('You need to login to write a review. Go to login page?')) {
                router.push('/login');
            }
            return;
        }
        showReviewModal.value = true;
    };

    console.log('LocationDetailPanel mounted with:', props.location);
    const amenities = computed(() => props.location.amenities || {});

    const galleryImages = computed(() => {
        // 1. Prioritize user-contributed images (merged from reviews)
        if (props.location.images && props.location.images.length > 0) {
            return props.location.images;
        }

        // 2. Google Photo Reference (Frontend Generation)
        if (props.location.photo_reference) {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (apiKey) {
                let refs = [];
                try {
                    if (props.location.photo_reference.startsWith('[')) {
                        refs = JSON.parse(props.location.photo_reference);
                    } else {
                        refs = [props.location.photo_reference];
                    }
                } catch (e) {
                    refs = [props.location.photo_reference];
                }

                return refs.map(ref =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`
                );
            }
        }

        return [];
    });

    const isVerified = computed(() => {
        return props.location.verification_status === 'verified' || props.location.verification_status === 'green';
    });

    const isPending = computed(() => {
        return props.location.verification_status === 'yellow' ||
            props.location.verification_status === 'pending' ||
            props.location.verification_status === 'in_review';
    });

    const cleanlinessScore = computed(() => {
        if (props.location.reviews && props.location.reviews.length > 0) {
            const sum = props.location.reviews.reduce((acc, r) => acc + (r.cleanliness_score || 0), 0);
            return Math.round(sum / props.location.reviews.length);
        }
        if (props.location.google_rating) {
            return props.location.google_rating;
        }
        return 0;
    });

    const reviews = computed(() => {
        if (viewModelReviews.value.length > 0 && viewModelReviews.value[0].location_id === props.location.location_id) {
            return viewModelReviews.value;
        }
        return props.location.reviews || [];
    });

    watch(() => props.location.location_id, (newId) => {
        if (newId) {
            loadReviews(newId);
        }
    }, { immediate: true });

    const openingHoursText = computed(() => {
        try {
            if (props.location.opening_hours) {
                const hours = typeof props.location.opening_hours === 'string'
                    ? JSON.parse(props.location.opening_hours)
                    : props.location.opening_hours;

                if (hours.open_now !== undefined) {
                    return hours.open_now ? 'Open Now' : 'Closed';
                }
                return 'Check Schedule';
            }
        } catch (e) { }
        return '';
    });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    const galleryRef = ref(null);
    const showLeftArrow = ref(false);
    const showRightArrow = ref(true);

    const checkScroll = () => {
        if (!galleryRef.value) return;
        const { scrollLeft, scrollWidth, clientWidth } = galleryRef.value;
        showLeftArrow.value = scrollLeft > 0;
        showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 5;
    };

    const scrollGallery = (direction) => {
        if (!galleryRef.value) return;
        const scrollAmount = 200;
        galleryRef.value.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    };

    onMounted(() => {
        setTimeout(checkScroll, 100);
    });

    watch(() => props.location, () => {
        setTimeout(checkScroll, 100);
    });

    const openImagePreview = (url) => {
        window.open(url, '_blank');
    };

    const getReviewImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `http://localhost:3000${img}`;
    };

    const handleReviewSubmit = async (reviewData) => {
        console.log('Submitting review:', reviewData);

        const formData = new FormData();
        formData.append('location_id', props.location.location_id);
        formData.append('review_text', reviewData.review_text);
        formData.append('cleanliness_score', reviewData.cleanliness_score);

        const waitMap = { 'none': 5, 'short': 4, 'medium': 3, 'long': 1 };
        formData.append('wait_time_score', waitMap[reviewData.wait_time] || 0);

        formData.append('amenities', JSON.stringify(reviewData.amenities));

        if (reviewData.images && reviewData.images.length > 0) {
            reviewData.images.forEach(file => {
                formData.append('images', file);
            });
        }

        const result = await createReview(formData, props.location.location_id);

        if (result.success) {
            alert('Review Submitted Successfully!');
            showReviewModal.value = false;
        } else {
            alert('Failed to submit review: ' + (result.error || 'Unknown error'));
        }
    };

    return {
        amenities,
        galleryImages,
        isVerified,
        isPending,
        cleanlinessScore,
        reviews,
        openingHoursText,
        formatDate,
        hasApiKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        galleryRef,
        showLeftArrow,
        showRightArrow,
        scrollGallery,
        checkScroll,
        openImagePreview,
        getReviewImageUrl,
        showReviewModal,
        handleReviewSubmit,
        handleAddReviewClick,
        ICONS
    };
}
