<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ $t('review_modal.title') }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body scroller">
        <!-- Cleanliness Rating -->
        <div class="form-group">
          <label>{{ $t('review_modal.cleanliness_rating') }} <span class="required">*</span></label>
          <div class="star-rating">
            <span 
              v-for="n in 5" 
              :key="n" 
              class="star" 
              :class="{ filled: n <= form.cleanliness_score }"
              @click="form.cleanliness_score = n"
            >{{ ICONS.STAR }}</span>
          </div>
          <p class="rating-text" v-if="form.cleanliness_score > 0">
            {{ getRatingText(form.cleanliness_score) }}
          </p>
        </div>

        <!-- Amenities Verification -->
        <div class="form-group">
          <label>{{ $t('review_modal.amenities_label') }}</label>
          <div class="amenities-grid-modal">
            <label class="amenity-check">
              <input type="checkbox" v-model="form.amenities.western_style">
              {{ $t('amenities.western_style') }}
            </label>
            <label class="amenity-check">
              <input type="checkbox" v-model="form.amenities.japanese_style">
              {{ $t('amenities.japanese_style') }}
            </label>
            <label class="amenity-check">
              <input type="checkbox" v-model="form.amenities.accessible">
              {{ $t('amenities.accessible') }}
            </label>
            <label class="amenity-check">
              <input type="checkbox" v-model="form.amenities.baby_changing">
              {{ $t('amenities.baby_changing') }}
            </label>
            <label class="amenity-check">
              <input type="checkbox" v-model="form.amenities.warm_seat">
              {{ $t('amenities.warm_seat') }}
            </label>
          </div>
        </div>

        <!-- Floor Verification / Addition -->
        <div class="form-group">
             <label>{{ $t('review_modal.floors_verify_label') || 'Which floor did you use?' }}</label>
             <div class="floor-selector-slim">
                 <!-- 1. Existing Floors to Verify -->
                 <div class="verify-floors-list" v-if="location.floors && location.floors.length > 0">
                     <p class="sub-label">{{ $t('review_modal.verify_existing') || 'Confirm existing:' }}</p>
                     <div class="floor-grid mini">
                         <button 
                             type="button" 
                             v-for="fl in location.floors"
                             :key="fl"
                             class="floor-btn"
                             :class="{ active: form.verified_floors.includes(fl) }"
                             @click="toggleReviewFloor(fl)"
                         >
                            {{ fl }} {{ form.verified_floors.includes(fl) ? '✓' : '' }}
                         </button>
                     </div>
                 </div>

                 <!-- 2. Add New Floors -->
                 <p class="sub-label">{{ $t('review_modal.add_new_floor') || 'Add missing floor:' }}</p>
                 <div class="floor-grid mini">
                      <button 
                          type="button" 
                          v-for="fl in ['B1','1F','2F','3F','4F','5F'].filter(f => !location.floors?.includes(f))"
                          :key="fl"
                          class="floor-btn"
                          :class="{ active: form.verified_floors.includes(fl) }"
                          @click="toggleReviewFloor(fl)"
                      >{{ fl }}</button>
                 </div>
                 
                 <!-- Custom Input -->
                 <div class="custom-floor-input mt-2">
                      <input 
                          type="text" 
                          v-model="customReviewFloor" 
                          placeholder="Other (e.g. 6F)..." 
                          class="form-input small"
                          @keydown.enter.prevent="addCustomReviewFloor"
                      />
                      <button type="button" class="btn-sm btn-secondary" @click="addCustomReviewFloor">Add</button>
                 </div>

                 <!-- Selected Tags -->
                 <div class="selected-floors-tags" v-if="form.verified_floors.length > 0">
                      <span v-for="fl in form.verified_floors" :key="fl" class="floor-tag">
                          {{ fl }} 
                          <span class="remove-floor" @click="toggleReviewFloor(fl)">×</span>
                      </span>
                 </div>
             </div>
        </div>

        <!-- Waiting Time -->
        <div class="form-group">
          <label>{{ $t('review_modal.wait_time') }}</label>
          <select v-model="form.wait_time" class="form-input">
            <option value="">{{ $t('review_modal.select_optional') }}</option>
            <option value="none">{{ $t('review_modal.wait_time_options.none') }}</option>
            <option value="short">{{ $t('review_modal.wait_time_options.short') }}</option>
            <option value="medium">{{ $t('review_modal.wait_time_options.medium') }}</option>
            <option value="long">{{ $t('review_modal.wait_time_options.long') }}</option>
          </select>
        </div>

        <!-- Location Accuracy -->
        <div class="form-group accuracy-check">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_location_accurate">
             {{ $t('review_modal.is_location_accurate') }}
          </label>
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label>{{ $t('review_modal.comment') }}</label>
          <textarea 
            v-model="form.review_text" 
            :placeholder="$t('review_modal.comment_placeholder')"
            rows="3"
            maxlength="500"
            class="form-input"
          ></textarea>
        </div>

        <!-- Photos -->
        <div class="form-group">
           <label>{{ $t('review_modal.photos') }}</label>
               <div class="photo-upload-area">
                  <input 
                    type="file" 
                    ref="fileInput" 
                    accept="image/*" 
                    multiple 
                    @change="handleFileUpload" 
                    style="display:none"
                  >
                  <input 
                    type="file" 
                    ref="cameraInput" 
                    accept="image/*" 
                    capture="environment"
                    @change="handleCameraUpload" 
                    style="display:none"
                  >
                  <div class="preview-grid">
                     <div class="preview-item" v-for="(img, index) in previewImages" :key="index">
                        <img :src="img.url" />
                        <button class="remove-btn" @click="removeImage(index)">×</button>
                     </div>
                     
                     <!-- Add Photo (Gallery) -->
                     <div 
                        class="add-photo-btn" 
                        v-if="previewImages.length < 3"
                        @click="$refs.fileInput.click()"
                     >
                        <span>{{ $t('review_modal.add_photo') }}</span>
                     </div>

                     <!-- Take Photo (Camera) -->
                     <div 
                        class="add-photo-btn camera-btn" 
                        v-if="previewImages.length < 3"
                        @click="$refs.cameraInput.click()"
                     >
                        <span>📷 {{ $t('review_modal.take_photo') }}</span>
                     </div>
                  </div>
               </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">{{ $t('review_modal.cancel') }}</button>
        <button class="btn-submit" @click="submitReview" :disabled="isSubmitting || form.cleanliness_score === 0">
          {{ isSubmitting ? $t('review_modal.submitting') : $t('review_modal.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue';
import { ICONS } from '../assets/icons';
import '../assets/styles/ReviewModal.css';

export default {
  name: 'ReviewModal',
  props: {
    location: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const isSubmitting = ref(false);
    const customReviewFloor = ref('');

    const form = reactive({
      cleanliness_score: 0,
      amenities: {
        western_style: false,
        japanese_style: false,
        accessible: false,
        baby_changing: false,
        warm_seat: false
      },
      is_location_accurate: false,
      wait_time: '',
      review_text: '',
      images: [], // Stores File objects
      verified_floors: [] // New: Selected floors
    });

    const previewImages = ref([]); // Stores { url: string, file: File }

    // Logic for Floors
    const toggleReviewFloor = (floor) => {
        const index = form.verified_floors.indexOf(floor);
        if (index > -1) {
            form.verified_floors.splice(index, 1);
        } else {
            form.verified_floors.push(floor);
        }
    };

    const addCustomReviewFloor = () => {
        const fl = customReviewFloor.value.trim();
        if (fl && !form.verified_floors.includes(fl)) {
            form.verified_floors.push(fl);
        }
        customReviewFloor.value = '';
    };

    const getRatingText = (score) => {
      const texts = ['Very Dirty', 'Dirty', 'Average', 'Clean', 'Very Clean/Sparkling'];
      return texts[score - 1];
    };

    const handleFileUpload = (event) => {
      const files = Array.from(event.target.files);
      processFiles(files);
      event.target.value = '';
    };

    const handleCameraUpload = (event) => {
      const files = Array.from(event.target.files); 
      processFiles(files);
      event.target.value = '';
    };

    const processFiles = (files) => {
      if (previewImages.value.length + files.length > 3) {
        alert("Maximum 3 photos allowed");
        return;
      }

      files.forEach(file => {
         const reader = new FileReader();
         reader.onload = (e) => {
            previewImages.value.push({ url: e.target.result, file: file });
            form.images.push(file);
         };
         reader.readAsDataURL(file);
      });
    };

    const removeImage = (index) => {
      previewImages.value.splice(index, 1);
      form.images.splice(index, 1);
    };

    const submitReview = () => {
      if (form.cleanliness_score === 0) {
        alert("Please rate cleanliness.");
        return;
      }
      isSubmitting.value = true;
      
      emit('submit', { ...form });
      
      setTimeout(() => {
         isSubmitting.value = false;
      }, 1000);
    };

    return {
      form,
      isSubmitting,
      previewImages,
      customReviewFloor, // New
      toggleReviewFloor, // New
      addCustomReviewFloor, // New
      getRatingText,
      handleFileUpload,
      handleCameraUpload,
      removeImage,
      submitReview,
      ICONS
    };
  }
};
</script>


