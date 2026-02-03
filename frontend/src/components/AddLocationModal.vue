<template>
  <div class="add-location-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ $t('add_location.title') }}</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body scroller">
        <form id="add-location-form" @submit.prevent="handleSubmit" class="add-form">
          <!-- Basic Info -->
          <div class="form-group">
            <label for="name">{{ $t('add_location.name') }} *</label>
            <input type="text" id="name" v-model="form.name" required :placeholder="$t('add_location.name_placeholder')" />
          </div>

          <div class="form-group">
            <label for="address">{{ $t('add_location.address') }} *</label>
            <div class="input-with-action">
              <input 
                type="text" 
                id="address" 
                v-model="form.address" 
                required 
                :placeholder="$t('add_location.address_placeholder')" 
                @blur="geocodeAddress"
              />
              <button type="button" class="btn-icon" @click="geocodeAddress" title="Find coordinates">{{ ICONS.SEARCH }}</button>
            </div>
            <small class="hint">{{ $t('add_location.auto_detect_hint') }}</small>
          </div>

          <!-- Hidden Lat/Lng, Logic Preserved -->
          <div class="form-row" style="display:none;">
            <input type="number" id="lat" v-model.number="form.latitude" step="any" readonly />
            <input type="number" id="lng" v-model.number="form.longitude" step="any" readonly />
          </div>

          <div class="form-group">
             <button type="button" class="btn-secondary btn-sm" @click="getCurrentLocation">
               {{ ICONS.LOCATION_PIN }} {{ $t('add_location.use_current_location') }}
             </button>
          </div>

          <hr class="divider">

          <!-- Business Info -->
          <div class="form-group">
            <label>{{ $t('add_location.details_label') || 'Details' }}</label>
            <div class="form-row">
              <input type="text" v-model="form.opening_hours" :placeholder="$t('location_detail.opening_hours_placeholder') || 'Opening Hours (e.g. 09:00 - 18:00)'" />
              <input type="text" v-model="form.closed_days" :placeholder="$t('location_detail.closed_days_placeholder') || 'Closed Days (e.g. Sat, Sun)'" />
            </div>
          </div>

          <div class="form-group">
            <textarea v-model="form.notes" :placeholder="$t('location_detail.notes_placeholder') || 'Additional notes...'" rows="2"></textarea>
          </div>

          <!-- Images -->
          <div class="form-group">
            <label>{{ $t('add_location.images_label') || 'Images' }}</label>
            <div class="image-upload-section">
                <input type="file" multiple accept="image/*" @change="handleImageUpload" :disabled="uploading" />
                <div v-if="uploading" class="uploading-indicator">{{ $t('add_location.uploading') || 'Uploading...' }}</div>
            </div>
            <div class="image-preview-list" v-if="form.images.length > 0">
                <div v-for="(img, idx) in form.images" :key="idx" class="image-preview-item">
                    <img :src="img" alt="Preview"/>
                    <button type="button" class="remove-img-btn" @click="removeImage(idx)">×</button>
                </div>
            </div>
          </div>

          <hr class="divider">

          <!-- Amenities -->
          <div class="form-group">
            <label>{{ $t('review_modal.amenities_label') }}</label>
            <div class="amenities-grid expanded">
              <label class="checkbox-btn" :class="{ active: form.amenities.western_style }">
                <input type="checkbox" v-model="form.amenities.western_style">
                {{ $t('amenities.western_style') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.japanese_style }">
                <input type="checkbox" v-model="form.amenities.japanese_style">
                {{ $t('amenities.japanese_style') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.accessible }">
                <input type="checkbox" v-model="form.amenities.accessible">
                {{ $t('amenities.accessible') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.child_seat }">
                <input type="checkbox" v-model="form.amenities.child_seat">
                {{ $t('amenities.child_seat') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.diaper_changing }">
                <input type="checkbox" v-model="form.amenities.diaper_changing">
                {{ $t('amenities.diaper_changing') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.warm_seat }">
                <input type="checkbox" v-model="form.amenities.warm_seat">
                {{ $t('amenities.warm_seat') }}
              </label>
              <!-- New Amenities -->
              <label class="checkbox-btn" :class="{ active: form.amenities.public_toilet }">
                <input type="checkbox" v-model="form.amenities.public_toilet">
                {{ $t('amenities.public_toilet') || 'Public' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.gender_separated }">
                <input type="checkbox" v-model="form.amenities.gender_separated">
                {{ $t('amenities.gender_separated') || 'Gender Separated' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.powder_room }">
                <input type="checkbox" v-model="form.amenities.powder_room">
                {{ $t('amenities.powder_room') || 'Powder Room' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.barrier_free }">
                <input type="checkbox" v-model="form.amenities.barrier_free">
                {{ $t('amenities.barrier_free') || 'Barrier Free' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.ostomate }">
                <input type="checkbox" v-model="form.amenities.ostomate">
                {{ $t('amenities.ostomate') || 'Ostomate' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.large_bed }">
                <input type="checkbox" v-model="form.amenities.large_bed">
                {{ $t('amenities.large_bed') || 'Large Bed' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.parking }">
                <input type="checkbox" v-model="form.amenities.parking">
                {{ $t('amenities.parking') || 'Parking' }}
              </label>
               <label class="checkbox-btn" :class="{ active: form.amenities.store_usage }">
                <input type="checkbox" v-model="form.amenities.store_usage">
                {{ $t('amenities.store_usage') || 'Store Usage' }}
              </label>
            </div>
          </div>



          <!-- Store/Facility Details (Floors) -->
          <div class="form-group" v-if="form.amenities.store_usage">
              <label>{{ $t('add_location.floors_label') || 'Select Floors with WC' }}</label>
              <div class="floor-selector">
                  <div class="floor-grid">
                      <button 
                          type="button" 
                          v-for="fl in ['B3','B2','B1','1F','2F','3F','4F','5F','6F','7F','8F','9F','10F']"
                          :key="fl"
                          class="floor-btn"
                          :class="{ active: form.floors.includes(fl) }"
                          @click="toggleFloor(fl)"
                      >{{ fl }}</button>
                  </div>
                  
                  <div class="custom-floor-input">
                      <input 
                          type="text" 
                          v-model="customFloor" 
                          placeholder="Other floor (e.g. 22F, Rooftop)" 
                          @keydown.enter.prevent="handleAddCustomFloor"
                      />
                      <button type="button" class="btn-sm btn-secondary" @click="handleAddCustomFloor">Add</button>
                  </div>
                  
                  <div class="selected-floors-tags" v-if="form.floors.length > 0">
                      <span v-for="fl in form.floors" :key="fl" class="floor-tag">
                          {{ fl }} 
                          <span class="remove-floor" @click="toggleFloor(fl)">×</span>
                      </span>
                  </div>
              </div>
          </div>

          <!-- Gender Type -->
          <div class="form-group">
            <label for="gender">{{ $t('add_location.gender_type') }} *</label>
            <select id="gender" v-model="form.gender_type" required>
              <option value="mixed">{{ $t('add_location.gender.mixed') }}</option>
              <option value="unisex">{{ $t('add_location.gender.unisex') }}</option>
              <option value="male">{{ $t('add_location.gender.male') }}</option>
              <option value="female">{{ $t('add_location.gender.female') }}</option>
            </select>
          </div>
          
          <p v-if="error" class="error-msg">{{ error }}</p>
        </form>
      </div>

      <div class="modal-footer">
        <button type="submit" form="add-location-form" class="btn-primary" :disabled="loading">
          {{ loading ? $t('add_location.computing') : $t('add_location.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAddLocationModal } from '../composables/useAddLocationModal';
import { ref } from 'vue'; // Import ref
import '../assets/styles/AddLocationModal.css';

export default {
  name: 'AddLocationModal',
  emits: ['close', 'added'],
  setup(props, { emit }) {
    const customFloor = ref('');

    const {
      form,
      loading,
      uploading,
      error,
      getCurrentLocation,
      geocodeAddress,
      handleImageUpload,
      removeImage,
      handleSubmit,
      toggleFloor, // New
      addCustomFloor, // New
      ICONS
    } = useAddLocationModal(emit);

    const handleAddCustomFloor = () => {
        if (customFloor.value.trim()) {
            addCustomFloor(customFloor.value.trim());
            customFloor.value = '';
        }
    };

    return {
      form,
      customFloor, // New
      handleAddCustomFloor, // New
      toggleFloor, // New
      loading,
      uploading,
      error,
      getCurrentLocation,
      geocodeAddress,
      handleImageUpload,
      removeImage,
      handleSubmit,
      ICONS
    };
  }
};
</script>
