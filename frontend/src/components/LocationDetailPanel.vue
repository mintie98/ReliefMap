<template>
  <div class="location-detail-panel" v-if="location">
    <div class="panel-header">
      <button class="close-btn" @click="$emit('close')">×</button>
      <h2 class="location-name">{{ location.display_name }}</h2>
    </div>

    <div class="panel-content scroller">
      <div class="address-section">
        <span class="icon">{{ ICONS.LOCATION_PIN }}</span>
        <span class="address-text">{{ location.address }}</span>
      </div>
      
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
                <span class="status-icon">{{ ICONS.VERIFIED }}</span> Verified
            </span>
            <span class="value status-unverified" v-else>
                <span class="status-icon">{{ ICONS.UNVERIFIED }}</span> Unverified
            </span>
        </div>
        <div class="time-row" v-if="openingHoursText">
             <span class="icon">{{ ICONS.CLOCK }}</span>
             <span class="value">{{ openingHoursText }}</span>
        </div>

        <div class="score-row">
            <span class="label">Crowd Score</span>
                <div class="stars">
                     <span v-for="n in 5" :key="n" :class="{ filled: n <= (Math.min((location.user_ratings_total || 0) / 10, 5)) }">{{ ICONS.STAR }}</span>
                     <span style="font-size:0.8rem; color:#666; margin-left:4px">({{ location.user_ratings_total || 0 }})</span>
                </div>
        </div>
        <div class="score-row">
            <span class="label">Cleanliness Score</span>
            <div class="stars">
                 <span v-for="n in 5" :key="n" :class="{ filled: n <= (cleanlinessScore || 0) }">{{ ICONS.STAR }}</span>
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
            <span class="nav-icon">{{ ICONS.BACK_ARROW }}</span> start navigation
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
import ReviewModal from './ReviewModal.vue';
import { useLocationDetailPanel } from '../composables/useLocationDetailPanel';
import '../assets/styles/LocationDetailPanel.css'; // Import styles

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
    // Logic extracted to composable
    const {
        amenities,
        galleryImages,
        isVerified,
        cleanlinessScore,
        reviews,
        openingHoursText,
        formatDate,
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
    } = useLocationDetailPanel(props);

    return {
        amenities,
        galleryImages,
        isVerified,
        cleanlinessScore,
        reviews,
        openingHoursText,
        formatDate,
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
};
</script>
