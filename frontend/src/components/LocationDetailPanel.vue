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
        <div class="placeholder-image">{{ $t('location_detail.no_images') }}</div>
      </div>

      <!-- Status & Scores -->
      <div class="info-section">
        <div class="status-row">
            <span class="label">{{ $t('location_detail.status') }}</span>
            <span class="value status-verified" v-if="isVerified">
                <span class="status-icon">{{ ICONS.VERIFIED }}</span> {{ $t('location_detail.verified') }}
            </span>
            <span class="value status-unverified" v-else>
                <span class="status-icon">{{ ICONS.UNVERIFIED }}</span> {{ $t('location_detail.unverified') }}
            </span>
        </div>
        <div class="time-row" v-if="openingHoursText">
             <span class="icon">{{ ICONS.CLOCK }}</span>
             <span class="value">{{ openingHoursText }}</span>
        </div>

        <div class="score-row">
            <span class="label">{{ $t('location_detail.crowd_score') }}</span>
                <div class="stars">
                     <span v-for="n in 5" :key="n" :class="{ filled: n <= (Math.min((location.user_ratings_total || 0) / 10, 5)) }">{{ ICONS.STAR }}</span>
                     <span style="font-size:0.8rem; color:#666; margin-left:4px">({{ location.user_ratings_total || 0 }})</span>
                </div>
        </div>
        <div class="score-row">
            <span class="label">{{ $t('location_detail.cleanliness_score') }}</span>
            <div class="stars">
                 <span v-for="n in 5" :key="n" :class="{ filled: n <= (cleanlinessScore || 0) }">{{ ICONS.STAR }}</span>
            </div>
        </div>
      </div>

      <!-- Amenities -->
      <div class="amenities-section">
        <h3>{{ $t('location_detail.toilet_amenities') }}</h3>
        <div class="amenities-grid">
            <div class="amenity-icon" :class="{ active: amenities.western_style }" :title="$t('amenities.western_style')">
                <img src="@/assets/amenities_icon/westen-styles.png" />
            </div>
            <div class="amenity-icon" :class="{ active: amenities.japanese_style }" :title="$t('amenities.japanese_style')">
                <img src="@/assets/amenities_icon/Jp-styles.png" />
            </div>
            <div class="amenity-icon" :class="{ active: amenities.accessible }" :title="$t('amenities.accessible')">
                 <img src="@/assets/amenities_icon/wheelchair.png" />
            </div>
            <div class="amenity-icon" :class="{ active: amenities.baby_changing }" :title="$t('amenities.baby_changing')">
                <img src="@/assets/amenities_icon/child-seat.png" />
            </div>
            <div class="amenity-icon" :class="{ active: amenities.warm_seat }" :title="$t('amenities.warm_seat')">
                <img src="@/assets/amenities_icon/bidet-seat.png" />
            </div>
             <div class="amenity-icon" :class="{ active: amenities.powder_corner }" :title="$t('amenities.powder_corner')">
                <img src="@/assets/amenities_icon/diaper-change.png" />
            </div>
        </div>
      </div>

      <!-- Info Details -->
      <div class="details-section">
        <h3>{{ $t('location_detail.toilet_info') }}</h3>
        <ul>
            <li>{{ $t('location_detail.toilet_details.gate_access') }}: {{ $t('location_detail.toilet_details.none') }}</li> <!-- Placeholder logic -->
            <li>{{ $t('location_detail.toilet_details.floor_level') }}: {{ $t('location_detail.toilet_details.none') }}</li>
            <li>{{ $t('location_detail.toilet_details.location_type') }}: {{ $t('location_detail.toilet_details.public_toilet') }}</li>
            <li>{{ $t('location_detail.toilet_details.gender_separation') }}: {{ amenities.gender_type ? $t(`add_location.gender.${amenities.gender_type}`) : $t('add_location.gender.mixed') }}</li>
        </ul>
      </div>

      <!-- Reviews -->
      <div class="reviews-section">
        <div class="reviews-header">
            <h3>{{ $t('location_detail.reviews') }}</h3>
            <button class="add-review-btn" @click="handleAddReviewClick">{{ $t('location_detail.add_review') }}</button>
        </div>
        
        <div v-if="reviews.length === 0" class="no-reviews">
            {{ $t('location_detail.no_reviews') }}
        </div>

        <div class="review-item" v-for="review in reviews" :key="review.review_id">
            <div class="review-top">
                <span class="reviewer-name">{{ review.user_name || 'Anonymous' }}</span>
                <span class="review-time">{{ formatDate(review.created_at) }}</span>
            </div>
            <div class="review-stars">
                 {{ $t('location_detail.cleanliness_score') }}: {{ review.cleanliness_score }}/5
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
            <span class="nav-icon">{{ ICONS.BACK_ARROW }}</span> {{ $t('location_detail.start_navigation') }}
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
