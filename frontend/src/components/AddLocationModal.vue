<template>
  <div class="add-location-overlay">
    <div class="modal-content scroller">
      <div class="modal-header">
        <h2>Add New Toilet</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
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
            <button type="button" class="btn-icon" @click="geocodeAddress" title="Find coordinates">🔍</button>
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
             📍 Use Current Location
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
import { reactive, ref } from 'vue';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';

export default {
  name: 'AddLocationModal',
  emits: ['close', 'added'],
  setup(props, { emit }) {
    const { createLocation } = useLocationViewModel();
    const loading = ref(false);
    const error = ref(null);

    const form = reactive({
      name: '',
      address: '',
      latitude: null,
      longitude: null,
      gender_type: 'mixed',
      amenities: {
        western_style: true,
        japanese_style: false,
        accessible: false,
        baby_changing: false,
        warm_seat: false
      }
    });

    const getCurrentLocation = () => {
      loading.value = true;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
             form.latitude = parseFloat(pos.coords.latitude.toFixed(6));
             form.longitude = parseFloat(pos.coords.longitude.toFixed(6));
             loading.value = false;
          },
          (err) => {
            alert('Cannot get location: ' + err.message);
            loading.value = false;
          }
        );
      } else {
        loading.value = false;
      }
    };

    const geocodeAddress = () => {
      if (!form.address || !window.google) return;
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: form.address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          form.latitude = parseFloat(location.lat().toFixed(6));
          form.longitude = parseFloat(location.lng().toFixed(6));
        } else {
          // Silent fail or small notification?
          console.warn('Geocoding failed');
        }
      });
    };

    const handleSubmit = async () => {
      loading.value = true;
      error.value = null;

      // Validate
      if (!form.latitude || !form.longitude) {
        error.value = 'Coordinates missing. Please enter a valid address or use current location.';
        loading.value = false;
        return;
      }

      const ugcData = {
        name: form.name,
        address_input: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        user_id: 1, 
        amenities: form.amenities,
        gender_type: form.gender_type
      };

      try {
        const result = await createLocation(ugcData);
        if (result.success) {
          alert(result.message || 'Location processed successfully!');
          emit('added');
          emit('close');
        } else {
          error.value = result.error || 'Failed to add location.';
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      loading,
      error,
      getCurrentLocation,
      geocodeAddress,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.add-location-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976D2;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

/* Input group with action button */
.input-with-action {
  display: flex;
  gap: 0.5rem;
}

.input-with-action input {
  flex: 1;
}

.btn-icon {
  background: #f1f5f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 42px;
  cursor: pointer;
  font-size: 1.2rem;
}

.btn-icon:hover {
  background: #e2e8f0;
}

input[type="text"],
input[type="number"],
select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus, select:focus {
  border-color: #1976D2;
}

.readonly-input {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.hint {
  font-size: 0.8rem;
  color: #64748b;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #333;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #1976D2;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
}

.btn-primary:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 0.5rem 0;
}

/* Amenities Grid */
.amenities-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.checkbox-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.checkbox-btn input {
  display: none; /* Hide default checkbox */
}

.checkbox-btn.active {
  background-color: #e3effb;
  border-color: #1976D2;
  color: #1976D2;
  font-weight: 600;
}

.checkbox-btn.active::before {
  content: '✓';
  font-weight: bold;
}

.error-msg {
  color: #EF4444;
  font-size: 0.9rem;
  text-align: center;
}
</style>
