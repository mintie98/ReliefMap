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

          <!-- Amenities -->
          <div class="form-group">
            <label>{{ $t('review_modal.amenities_label') }}</label>
            <div class="amenities-grid">
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
              <label class="checkbox-btn" :class="{ active: form.amenities.baby_changing }">
                <input type="checkbox" v-model="form.amenities.baby_changing">
                {{ $t('amenities.baby_changing') }}
              </label>
              <label class="checkbox-btn" :class="{ active: form.amenities.warm_seat }">
                <input type="checkbox" v-model="form.amenities.warm_seat">
                {{ $t('amenities.warm_seat') }}
              </label>
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
import '../assets/styles/AddLocationModal.css';

export default {
  name: 'AddLocationModal',
  emits: ['close', 'added'],
  setup(props, { emit }) {
    const {
      form,
      loading,
      error,
      getCurrentLocation,
      geocodeAddress,
      handleSubmit,
      ICONS
    } = useAddLocationModal(emit);

    return {
      form,
      loading,
      error,
      getCurrentLocation,
      geocodeAddress,
      handleSubmit,
      ICONS
    };
  }
};
</script>
