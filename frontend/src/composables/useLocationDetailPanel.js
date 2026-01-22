import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import authService from '../services/authService';
import { ICONS } from '../assets/icons';
import { useToast } from './useToast';
import i18n from '../i18n';

export function useLocationDetailPanel(props) {
    const showReviewModal = ref(false);
    const { createReview, reviews: viewModelReviews, loadReviews } = useReviewViewModel();
    const router = useRouter();
    const toast = useToast();

    const handleAddReviewClick = () => {
        if (!authService.isAuthenticated()) {
            if (confirm(i18n.global.t('messages.login_required'))) {
                router.push('/login');
            }
            return;
        }
        showReviewModal.value = true;
    };

    const amenities = computed(() => props.location.amenities || {});

    const galleryImages = computed(() => {
        let images = [];
        const appReviewImages = [];

        // 0. Lấy ảnh từ App Reviews (Luôn hiển thị nếu có)
        // Ưu tiên lấy từ viewModel (đã fetch full) -> props (static)
        const sourceReviews = (viewModelReviews.value && viewModelReviews.value.length > 0 && viewModelReviews.value[0].location_id === props.location.location_id)
            ? viewModelReviews.value
            : (props.location.reviews || []);

        if (sourceReviews && Array.isArray(sourceReviews)) {
            sourceReviews.forEach(review => {
                if (review.images && Array.isArray(review.images)) {
                    review.images.forEach(img => {
                        // Đảm bảo URL đầy đủ
                        // Process URL to handle Mixed Content (HTTPS frontend vs HTTP backend)
                        // Converts http://localhost:3000/... to /... to use Vite proxy
                        let fullUrl = img;
                        if (fullUrl.includes('localhost:3000')) {
                            fullUrl = fullUrl.replace(/^https?:\/\/localhost:3000/, '');
                        } else if (!fullUrl.startsWith('http')) {
                            // Keep relative paths relative, don't prepend host
                            fullUrl = fullUrl;
                        }
                        appReviewImages.push(fullUrl);
                    });
                }
            });
        }

        // Trường hợp 1: WC từ Google API (thường có photo_reference và source_type là api/google)
        // Ưu tiên hiển thị: Ảnh Google API + Ảnh Reviews từ App
        const isGoogleLocation = props.location.photo_reference ||
            (props.location.source_type && props.location.source_type.includes('google')) ||
            (props.location.source_type === 'api');

        if (isGoogleLocation) {
            // 1a. Lấy ảnh từ Google Photo Reference
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

                    // Map ra Google API URL
                    const googleImages = refs.map(ref =>
                        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`
                    );
                    images = [...images, ...googleImages];
                }
            }

            // 1b. Cộng thêm ảnh từ App Reviews
            images = [...images, ...appReviewImages];

        } else {
            // Trường hợp 2: WC do User thêm (UGC)
            // Hiển thị: Ảnh gốc do người tạo thêm + Ảnh Reviews từ App

            // 2a. Lấy ảnh gốc (Owner images)
            if (props.location.images) {
                let ownerImages = props.location.images;
                // Parse nếu backend trả về string JSON (đề phòng)
                if (typeof ownerImages === 'string') {
                    try { ownerImages = JSON.parse(ownerImages); } catch (e) { }
                }

                if (Array.isArray(ownerImages)) {
                    // Đảm bảo URL đầy đủ cho owner images
                    const fullOwnerImages = ownerImages.map(img => {
                        let fullUrl = img;
                        if (fullUrl.includes('localhost:3000')) {
                            fullUrl = fullUrl.replace(/^https?:\/\/localhost:3000/, '');
                        }
                        // If relative, leave it relative
                        return fullUrl;
                    });
                    images = [...images, ...fullOwnerImages];
                }
            }

            // 2b. Cộng thêm ảnh từ App Reviews
            // Nếu không có ảnh gốc thì hiển thị ảnh review
            images = [...images, ...appReviewImages];
        }

        return images;
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
        // Prioritize user entered opening hours
        if (props.location.user_opening_hours) return props.location.user_opening_hours;

        try {
            // Fallback to Google hours (JSON or object)
            // Note: DB returns google_opening_hours from query aliases I added
            const gh = props.location.google_opening_hours || props.location.opening_hours;

            if (gh) {
                const hours = typeof gh === 'string' ? JSON.parse(gh) : gh;
                if (hours.open_now !== undefined) {
                    return hours.open_now ? 'Open Now' : 'Closed';
                }
                // If it's the simple string format we might have stored
                if (typeof hours === 'string') return hours;

                return 'Check Schedule';
            }
        } catch (e) { }
        return '';
    });

    const closedDaysText = computed(() => props.location.closed_days || '');
    const notesText = computed(() => props.location.notes || '');

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
            toast.success(i18n.global.t('messages.review_success'));
            showReviewModal.value = false;
        } else {
            const errorMsg = result.error || i18n.global.t('messages.unknown_error');
            toast.error(i18n.global.t('messages.review_error', { error: errorMsg }));
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
        closedDaysText,
        notesText,
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
