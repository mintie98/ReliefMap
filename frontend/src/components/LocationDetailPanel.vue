<template>
  <div class="location-detail-panel" v-if="location">
    <div class="panel-header">
      <button class="close-btn" @click="$emit('close')">×</button>
      <h2 class="location-name">{{ location.display_name }}</h2>
    </div>

    <div class="panel-content scroller">
      <div class="address-section">
        <span class="icon">📍</span>
        <span class="address-text">{{ location.address }}</span>
      </div>
      
      <!-- DEBUG INFO (Remove later) -->
      <!-- <div style="font-size: 10px; color: red; word-break: break-all;">
        Has Photo Ref: {{ !!location.photo_reference }} <br>
        Ref Length: {{ location.photo_reference ? location.photo_reference.length : 0 }} <br>
        API Key: {{ hasApiKey ? 'Present' : 'Missing' }}
      </div> -->

      <!-- Image Gallery -->
      <div class="gallery-container" v-if="galleryImages.length > 0">
         <button class="gallery-nav prev" @click="scrollGallery(-1)" v-if="showLeftArrow">‹</button>
         
         <div class="image-gallery" ref="galleryRef" @scroll="checkScroll">
             <div 
                class="gallery-item" 
                v-for="(img, index) in galleryImages" 
                :key="index"
                :style="{ backgroundImage: `url(${img})` }"
                @click="openImagePreview(img)"
             ></div>
         </div>
         
         <button class="gallery-nav next" @click="scrollGallery(1)" v-if="showRightArrow">›</button>
      </div>
      <div class="no-images" v-else>
        <div class="placeholder-image">No Images</div>
      </div>

      <!-- Status & Scores -->
      <div class="info-section">
        <div class="status-row">
            <span class="label">Status:</span>
            <span class="value status-verified" v-if="isVerified">
                <span class="status-icon">🛡️</span> Verified
            </span>
            <span class="value status-unverified" v-else>
                <span class="status-icon">⚠️</span> Unverified
            </span>
        </div>
        <div class="time-row" v-if="openingHoursText">
             <span class="icon">🕒</span>
             <span class="value">{{ openingHoursText }}</span>
        </div>

        <div class="score-row">
            <span class="label">Crowd Score</span>
                <div class="stars">
                     <!-- Using Google User Ratings Total as proxy for "Crowd" level for now, or random -->
                     <span v-for="n in 5" :key="n" :class="{ filled: n <= (Math.min((location.user_ratings_total || 0) / 10, 5)) }">★</span>
                     <span style="font-size:0.8rem; color:#666; margin-left:4px">({{ location.user_ratings_total || 0 }})</span>
                </div>
        </div>
        <div class="score-row">
            <span class="label">Cleanliness Score</span>
            <div class="stars">
                 <!-- Use simple star rendering logic -->
                 <span v-for="n in 5" :key="n" :class="{ filled: n <= (cleanlinessScore || 0) }">★</span>
            </div>
        </div>
      </div>

      <!-- Amenities -->
      <div class="amenities-section">
        <h3>Toilet Amenities</h3>
        <div class="amenities-grid">
            <div class="amenity-icon" :class="{ active: amenities.western_style }" title="Western Style">
                <img src="../assets/amenities_icon/westen-styles.png" />
            </div>
            <div class="amenity-icon" :class="{ active: amenities.japanese_style }" title="Japanese Style">
                <img src="../assets/amenities_icon/Jp-styles.png" />
            </div>
             <div class="amenity-icon" :class="{ active: amenities.accessible }" title="Accessible">
                <img src="../assets/amenities_icon/wheelchair.png" />
            </div>
             <div class="amenity-icon" :class="{ active: amenities.baby_changing }" title="Baby Changing">
                <img src="../assets/amenities_icon/diaper-change.png" /> 
            </div>
             <div class="amenity-icon" :class="{ active: amenities.warm_seat }" title="Warm Seat">
                <img src="../assets/amenities_icon/bidet-seat.png" />
            </div>
        </div>
      </div>

      <!-- Info Details -->
      <div class="details-section">
        <h3>Toilet info:</h3>
        <ul>
            <li>Gate Access Status: None</li> <!-- Placeholder -->
            <li>Floor Level: None</li>
            <li>Location Type: Public Toilet</li>
            <li>Gender Separation: {{ amenities.gender_type || 'Mixed' }}</li>
        </ul>
      </div>

      <!-- Reviews -->
      <div class="reviews-section">
        <div class="reviews-header">
            <h3>Reviews</h3>
            <button class="add-review-btn" @click="handleAddReviewClick">Add Review</button>
        </div>
        
        <div v-if="reviews.length === 0" class="no-reviews">
            No reviews yet. Be the first!
        </div>

        <div class="review-item" v-for="review in reviews" :key="review.review_id">
            <div class="review-top">
                <span class="reviewer-name">{{ review.user_name || 'Anonymous' }}</span>
                <span class="review-time">{{ formatDate(review.created_at) }}</span>
            </div>
            <div class="review-stars">
                 Cleanliness: {{ review.cleanliness_score }}/5
            </div>
            <p class="review-text">{{ review.review_text }}</p>
             <div class="review-images" v-if="review.images && review.images.length">
                <img v-for="(img, i) in review.images" :key="i" :src="getReviewImageUrl(img)" class="review-thumb" @click="openImagePreview(getReviewImageUrl(img))" />
            </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
        <button class="nav-btn" @click="$emit('navigate', location)">
            <span class="nav-icon">➤</span> start navigation
        </button>
    </div>

    <!-- Review Modal -->
    <teleport to="body">
       <ReviewModal 
          v-if="showReviewModal" 
          @close="showReviewModal = false"
          @submit="handleReviewSubmit"
       />
    </teleport>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import authService from '../services/authService';
import ReviewModal from './ReviewModal.vue';

export default {
  name: 'LocationDetailPanel',
  components: { ReviewModal },
  props: {
    location: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'navigate', 'add-review'],
  setup(props, { emit }) {
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
    const amenities = computed(() => props.location.amenities || {}); // Backend returns amenities object from join
    
    // Check files from step 86: 
    // Jp-styles.png, bidet-seat.png, child-seat.png, diaper-change.png, westen-styles.png, wheelchair.png
    
    // Logic for images:
    // 1. Check location.images (aggregated from users)
    // 2. If 'api' source, maybe we don't have images yet unless we fetch Photo API. 
    //    For now, use user images.
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
                     // Try to parse as JSON array (new format)
                     if (props.location.photo_reference.startsWith('[')) {
                         refs = JSON.parse(props.location.photo_reference);
                     } else {
                         // Legacy or single string
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
    
    const cleanlinessScore = computed(() => {
        // Calculate average from reviews if present
        if (props.location.reviews && props.location.reviews.length > 0) {
            const sum = props.location.reviews.reduce((acc, r) => acc + (r.cleanliness_score || 0), 0);
            return Math.round(sum / props.location.reviews.length);
        }
        // Fallback to Google Rating
        if (props.location.google_rating) {
            return props.location.google_rating;
        }
        return 0;
    });

    const reviews = computed(() => {
        // Prefer live ViewModel data if it corresponds to current location
         if (viewModelReviews.value.length > 0 && viewModelReviews.value[0].location_id === props.location.location_id) {
             return viewModelReviews.value;
         }
         // Fallback to initial prop data, but also trigger load if empty and we haven't loaded yet?
         return props.location.reviews || [];
    });

    // Load reviews when location changes
    watch(() => props.location.location_id, (newId) => {
        if (newId) {
            loadReviews(newId);
        }
    }, { immediate: true });

    const openingHoursText = computed(() => {
        // Parse opening_hours JSON if exists
        try {
            if (props.location.opening_hours) {
                const hours = typeof props.location.opening_hours === 'string' 
                    ? JSON.parse(props.location.opening_hours) 
                    : props.location.opening_hours;
                
                if (hours.open_now !== undefined) {
                    return hours.open_now ? 'Open Now' : 'Closed';
                }
                // Very simplified logic
                return 'Check Schedule'; 
            }
        } catch (e) {}
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
        showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 5; // buffer
    };

    const scrollGallery = (direction) => {
        if (!galleryRef.value) return;
        const scrollAmount = 200; // Scroll by 200px
        galleryRef.value.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    };

    // Initial check
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
        // Assuming backend is at localhost:3000 (matching vite proxy)
        // If server.js default is 4001, verify if PORT env is set. user reports API works, so port must match proxy.
        // We can try to use relative path if we fixed proxy, but to be safe without restart:
        return `http://localhost:3000${img}`; 
    };

    const handleReviewSubmit = async (reviewData) => {
      console.log('Submitting review:', reviewData);
      
      const formData = new FormData();
      formData.append('location_id', props.location.location_id);
      formData.append('review_text', reviewData.review_text);
      formData.append('cleanliness_score', reviewData.cleanliness_score);
      
      // Map wait_time string to score if needed, or send as string
      // Assuming backend/repo stores wait_time_score as int? 
      // Let's send arbitrary scores for now: 'none' -> 5, 'short' -> 4, 'medium' -> 3, 'long' -> 1
      const waitMap = { 'none': 5, 'short': 4, 'medium': 3, 'long': 1 };
      formData.append('wait_time_score', waitMap[reviewData.wait_time] || 0);

      formData.append('amenities', JSON.stringify(reviewData.amenities));

      if (reviewData.images && reviewData.images.length > 0) {
        reviewData.images.forEach(file => {
          formData.append('images', file);
        });
      }

      // We pass location_id as 2nd arg to reload reviews
      const result = await createReview(formData, props.location.location_id);
      
      if (result.success) {
        alert('Review Submitted Successfully!');
        showReviewModal.value = false;
        // Optionally fetch location again to update aggregate scores immediately?
        // useReviewViewModel.loadReviews updates the reviews list. 
        // We might want to re-fetch "location details" to update header scores.
      } else {
        alert('Failed to submit review: ' + (result.error || 'Unknown error'));
      }
    };

    return {
        amenities,
        galleryImages,
        isVerified,
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
        scrollGallery,
        checkScroll,
        openImagePreview,
        getReviewImageUrl,
        showReviewModal,
        showReviewModal,
        handleReviewSubmit,
        handleAddReviewClick
    };
  }
};
</script>

<style scoped>
.location-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  position: relative;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  text-align: center;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.location-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.address-section {
  display: flex;
  align-items: flex-start;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 1rem;
}

.address-section .icon {
  color: #EA4335; /* Red pin */
  margin-right: 0.5rem;
}

/* Gallery */
.gallery-container {
    position: relative;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.image-gallery {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Hide scrollbar for cleaner UI */
  width: 100%;
}
.image-gallery::-webkit-scrollbar {
    display: none;
}

.gallery-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.8);
    border: 1px solid #ddd;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding-bottom: 3px; /* visual center fix */
}
.gallery-nav:hover {
    background: white;
}
.gallery-nav.prev {
    left: 0;
}
.gallery-nav.next {
    right: 0;
}

.gallery-item {
  min-width: 120px;
  height: 90px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  background-color: #ddd;
}

/* Info */
.info-section {
  margin-bottom: 1.5rem;
}

.status-row, .time-row, .score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.status-verified {
  color: #34A853; /* Green */
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.time-row .value {
  color: #34A853;
  font-weight: 600;
}

.stars {
  color: #FBBC04; /* Yellow */
}

.stars span.filled {
    color: #FBBC04;
}
.stars span {
    color: #ddd;
}

/* Amenities */
.amenities-section {
  margin-bottom: 1.5rem;
}

.amenities-section h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.amenities-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.amenity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3; /* Inactive style */
}

.amenity-icon.active {
    opacity: 1;
    border-color: #1976D2;
}

.amenity-icon img {
    width: 24px;
    height: 24px;
}

/* Details List */
.details-section {
    margin-bottom: 1.5rem;
}
.details-section h3 {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}
.details-section ul {
    list-style: none;
    padding: 0;
    font-size: 0.85rem;
    color: #444;
}
.details-section li {
    margin-bottom: 0.25rem;
}

/* Reviews */
.reviews-section {
    margin-bottom: 3rem;
}

.reviews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.add-review-btn {
    background: #1976D2;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
}

.review-item {
    background: #f9f9f9;
    padding: 0.8rem;
    border-radius: 8px;
    margin-bottom: 1rem;
}

.review-top {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
}

.reviewer-name {
    font-weight: 600;
    color: #333;
}

.review-text {
    font-size: 0.9rem;
    margin: 0.5rem 0;
}

.review-thumb {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    object-fit: cover;
    margin-right: 0.5rem;
}

/* Footer */
.panel-footer {
    /* position: absolute; removed to allow flex flow */
    /* bottom: 0; */
    /* left: 0; */
    width: 100%;
    padding: 1rem;
    background: white;
    border-top: 1px solid #eee;
    z-index: 10;
    flex-shrink: 0; /* Don't shrink */
}

.nav-btn {
    width: 100%;
    background-color: #40E0D0; /* Turquoise as in image */
    color: #000;
    font-weight: 700;
    font-size: 1.1rem;
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.nav-icon {
    color: #E04F5F; /* Red arrow */
}
</style>
