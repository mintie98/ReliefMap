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
          <div class="amenities-grid">
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

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  position: relative;
  background: white;
  width: 90%;
  max-width: 550px; /* Increased */
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.modal-header {
  padding: 1.75rem 2rem 1rem; /* Consistent padding */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: #f1f5f9;
  border: none;
  font-size: 1rem;
  color: #64748b;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-body {
  padding: 0 2rem 2rem; /* Increased padding */
  overflow-y: auto;
  flex: 1;
}

/* SLEEK Scroller */
.scroller::-webkit-scrollbar {
  width: 4px;
}
.scroller::-webkit-scrollbar-track {
  background: transparent;
}
.scroller::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
.scroller::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.required {
  color: red;
}

.star-rating {
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
}

.star {
  margin-right: 0.2rem;
  transition: color 0.2s;
}

.star:hover, .star.filled {
  color: #FBBC04;
}

.rating-text {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
  font-weight: 500;
}

.amenities-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.amenity-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-input:focus {
  border-color: #1976D2;
  outline: none;
}

/* Photo Upload */
.preview-grid {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-photo-btn {
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.add-photo-btn:hover {
  background: #eee;
  border-color: #999;
}

.camera-btn {
  background: #E8F0FE;
  border-color: #1976D2;
  color: #1976D2;
}
.camera-btn:hover {
  background: #D2E3FC;
}

/* Footer */
.modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: none;
  border: none;
  font-weight: 600;
  color: #666;
  cursor: pointer;
}

.btn-submit {
  background-color: #1976D2;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:disabled {
  background-color: #9cc3e8;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
      width: 100%;
      max-width: none;
      height: 85vh;
      border-radius: 20px 20px 0 0;
      max-height: none;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 0.5rem;
  }

  .modal-body {
    padding: 0.5rem 1.5rem 2rem;
  }

  .modal-footer {
    padding: 1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 15px));
    flex-direction: column-reverse; /* Stack buttons on small screens */
  }

  .btn-submit, .btn-cancel {
    width: 100%;
    padding: 1rem;
  }
}

.accuracy-check {
    background: #f0f7ff;
    padding: 0.8rem;
    border-radius: 6px;
    border: 1px solid #cce5ff;
}
.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    color: #1976D2;
}
.checkbox-label input {
    width: 18px;
    height: 18px;
}

/* Floor Selector Slim (Review Modal) */
.floor-selector-slim {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}
.sub-label {
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 5px;
    font-weight: 600;
}
.floor-grid.mini {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
}
.floor-btn {
    padding: 4px 10px;
    border: 1px solid #ccc;
    background: white;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 36px;
    text-align: center;
}
.floor-btn:hover {
    background: #f0f0f0;
}
.floor-btn.active {
    background: #4285F4;
    color: white;
    border-color: #3367d6;
    font-weight: bold;
}
.verify-floors-list {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #ddd;
}
.custom-floor-input.mt-2 {
    margin-top: 8px;
    display: flex;
    gap: 6px;
}
.form-input.small {
    padding: 6px;
    font-size: 0.85rem;
}
.selected-floors-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}
.floor-tag {
    background: #e8f0fe;
    color: #1a73e8;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
}
.remove-floor {
    cursor: pointer;
    font-weight: bold;
    color: #1967d2;
}
</style>
