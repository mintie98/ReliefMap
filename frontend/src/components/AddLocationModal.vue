<template>
  <div class="add-location-overlay">
    <div class="modal-content scroller">
      <div class="modal-header">
        <h2>Add New Toilet</h2>
        <button class="close-btn" @click="$emit('close')">{{ ICONS.CLOSE }}</button>
      </div>

      <form @submit.prevent="handleSubmit" class="add-form">
        <!-- Basic Info -->
        <div class="form-group">
          <label for="name">Name *</label>
          <input type="text" id="name" v-model="form.name" required placeholder="e.g. Park Restroom" />
        </div>

        <div class="form-group">
          <label for="address">Address *</label>
          <div class="input-with-action">
            <input 
              type="text" 
              id="address" 
              v-model="form.address" 
              required 
              placeholder="e.g. 1-1-1 Shibuya" 
              @blur="geocodeAddress"
            />
            <button type="button" class="btn-icon" @click="geocodeAddress" title="Find coordinates">{{ ICONS.SEARCH }}</button>
          </div>
          <small class="hint">Enter address to auto-detect coordinates</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="lat">Latitude (Auto)</label>
            <input type="number" id="lat" v-model.number="form.latitude" step="any" readonly class="readonly-input" />
          </div>
          <div class="form-group">
            <label for="lng">Longitude (Auto)</label>
            <input type="number" id="lng" v-model.number="form.longitude" step="any" readonly class="readonly-input" />
          </div>
        </div>

        <div class="form-group">
           <button type="button" class="btn-secondary btn-sm" @click="getCurrentLocation">
             {{ ICONS.LOCATION_PIN }} Use Current Location
           </button>
        </div>

        <hr class="divider">

        <!-- Amenities -->
        <div class="form-group">
          <label>Amenities (Select all that apply)</label>
          <div class="amenities-grid">
            <label class="checkbox-btn" :class="{ active: form.amenities.western_style }">
              <input type="checkbox" v-model="form.amenities.western_style">
              Western Style
            </label>
            <label class="checkbox-btn" :class="{ active: form.amenities.japanese_style }">
              <input type="checkbox" v-model="form.amenities.japanese_style">
              Japanese Style
            </label>
            <label class="checkbox-btn" :class="{ active: form.amenities.accessible }">
              <input type="checkbox" v-model="form.amenities.accessible">
              Accessible
            </label>
            <label class="checkbox-btn" :class="{ active: form.amenities.baby_changing }">
              <input type="checkbox" v-model="form.amenities.baby_changing">
              Baby Changing
            </label>
            <label class="checkbox-btn" :class="{ active: form.amenities.warm_seat }">
              <input type="checkbox" v-model="form.amenities.warm_seat">
              Warm Seat
            </label>
          </div>
        </div>

        <!-- Gender Type -->
        <div class="form-group">
          <label for="gender">Gender Type *</label>
          <select id="gender" v-model="form.gender_type" required>
            <option value="mixed">Mixed</option>
            <option value="unisex">Unisex</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Computing...' : 'Submit Toilet' }}
          </button>
        </div>
        
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
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
