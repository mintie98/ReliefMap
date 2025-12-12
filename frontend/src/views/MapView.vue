<template>
  <div class="map-view">
    <div class="map-container">
      <div id="map" ref="mapContainer"></div>
      
      <div class="map-controls">
        <div class="control-panel">
          <h3>Filters</h3>
          
          <div class="filter-group">
            <label>Verification Status</label>
            <select v-model="filters.verificationStatus" @change="applyFilters">
              <option :value="null">All</option>
              <option value="green">Verified (Green)</option>
              <option value="yellow">Pending (Yellow)</option>
              <option value="red">Unverified (Red)</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Source Type</label>
            <select v-model="filters.sourceType" @change="applyFilters">
              <option :value="null">All</option>
              <option value="api">Google API</option>
              <option value="user">User Generated</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Radius (km)</label>
            <input
              v-model.number="filters.radius"
              type="number"
              min="1"
              max="50"
              @change="applyFilters"
            />
          </div>

          <button @click="getCurrentLocation" class="btn-locate">📍 Use My Location</button>
          <button @click="searchGooglePlaces" class="btn-google">🔍 Search Google Places</button>
        </div>

        <div class="location-list-panel">
          <h3>Locations ({{ filteredLocations.length }})</h3>
          <div v-if="loading" class="loading">Loading...</div>
          <div v-if="error" class="error">{{ error }}</div>
          
          <div class="location-items">
            <div
              v-for="location in filteredLocations"
              :key="location.location_id"
              class="location-item"
              @click="focusLocation(location)"
              :class="{ active: selectedLocation?.location_id === location.location_id }"
            >
              <h4>{{ location.display_name }}</h4>
              <p class="address">{{ location.address }}</p>
              <div class="location-badges">
                <span class="badge" :style="{ backgroundColor: location.getStatusColor() }">
                  {{ location.verification_status }}
                </span>
                <span class="badge">{{ location.source_type }}</span>
                <span v-if="location.distance" class="badge">
                  {{ location.distance.toFixed(2) }} km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Location Detail Modal -->
    <div v-if="selectedLocation" class="modal" @click.self="selectedLocation = null">
      <div class="modal-content">
        <button class="close-btn" @click="selectedLocation = null">×</button>
        <h2>{{ selectedLocation.display_name }}</h2>
        <p class="address">{{ selectedLocation.address }}</p>
        
        <div class="location-details">
          <div class="detail-item">
            <strong>Status:</strong>
            <span :style="{ color: selectedLocation.getStatusColor() }">
              {{ selectedLocation.verification_status.toUpperCase() }}
            </span>
          </div>
          <div class="detail-item">
            <strong>Source:</strong> {{ selectedLocation.source_type }}
          </div>
          <div class="detail-item">
            <strong>Verification Score:</strong> {{ selectedLocation.verification_score }}
          </div>
        </div>

        <div v-if="amenities" class="amenities">
          <h3>Amenities</h3>
          <div class="amenity-list">
            <span v-if="amenities.western_style" class="amenity-tag">Western Style</span>
            <span v-if="amenities.japanese_style" class="amenity-tag">Japanese Style</span>
            <span v-if="amenities.accessible" class="amenity-tag">Wheelchair Accessible</span>
            <span v-if="amenities.baby_changing" class="amenity-tag">Baby Changing</span>
            <span v-if="amenities.warm_seat" class="amenity-tag">Warm Seat</span>
            <span class="amenity-tag">{{ amenities.gender_type }}</span>
          </div>
        </div>

        <div class="reviews-section">
          <h3>Reviews</h3>
          <div v-if="reviewsLoading" class="loading">Loading reviews...</div>
          <div v-else-if="reviews.length === 0" class="no-reviews">No reviews yet</div>
          <div v-else class="reviews-list">
            <div v-for="review in reviews" :key="review.review_id" class="review-item">
              <div class="review-header">
                <strong>{{ review.user_name }}</strong>
                <span class="review-date">{{ review.getFormattedDate() }}</span>
              </div>
              <p class="review-text">{{ review.review_text }}</p>
              <div class="review-scores">
                <span>Cleanliness: {{ review.cleanliness_score }}/5</span>
                <span>Wait Time: {{ review.wait_time_score }}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import apiClient from '../services/api';

export default {
  name: 'MapView',
  setup() {
    const mapContainer = ref(null);
    let map = null;
    let markers = [];
    
    const selectedLocation = ref(null);
    const amenities = ref(null);
    const reviewsLoading = ref(false);

    const {
      locations,
      filteredLocations,
      loading,
      error,
      filters,
      loadLocations,
      loadLocationById,
      updateFilters,
      clearFilters
    } = useLocationViewModel();

    const {
      reviews,
      loadReviews
    } = useReviewViewModel();

    // Initialize map
    const initMap = () => {
      if (!window.google || !mapContainer.value) return;

      const defaultCenter = { lat: 35.6762, lng: 139.6503 }; // Tokyo default
      
      map = new window.google.maps.Map(mapContainer.value, {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: true
      });

      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(userLocation);
            updateFilters({ lat: userLocation.lat, lng: userLocation.lng });
            loadLocations();
          },
          () => {
            // Use default location
            loadLocations();
          }
        );
      } else {
        loadLocations();
      }
    };

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&callback=initReliefMap`;
      script.async = true;
      script.defer = true;
      window.initReliefMap = initMap;
      document.head.appendChild(script);
    };

    // Update markers on map
    const updateMarkers = () => {
      if (!map) return;

      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      markers = [];

      // Add new markers
      filteredLocations.value.forEach(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: map,
          title: location.display_name,
          icon: {
            url: `data:image/svg+xml;base64,${btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="${location.getStatusColor()}" stroke="white" stroke-width="2"/>
                <text x="16" y="20" font-size="16" fill="white" text-anchor="middle">🚽</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        marker.addListener('click', () => {
          focusLocation(location);
        });

        markers.push(marker);
      });
    };

    // Focus on location
    const focusLocation = async (location) => {
      selectedLocation.value = location;
      
      if (map) {
        map.setCenter({ lat: location.latitude, lng: location.longitude });
        map.setZoom(15);
      }

      // Load amenities
      try {
        const response = await apiClient.get(`/amenities/location/${location.location_id}`);
        amenities.value = response.data;
      } catch (err) {
        amenities.value = null;
      }

      // Load reviews
      reviewsLoading.value = true;
      await loadReviews(location.location_id);
      reviewsLoading.value = false;
    };

    // Get current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            updateFilters({ lat: userLocation.lat, lng: userLocation.lng });
            if (map) {
              map.setCenter(userLocation);
            }
            loadLocations();
          },
          (error) => {
            alert('Unable to get your location: ' + error.message);
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
      }
    };

    // Search Google Places
    const searchGooglePlaces = async () => {
      const query = prompt('Enter search query (e.g., "toilet near me"):');
      if (!query) return;

      const center = map?.getCenter();
      const location = center ? { lat: center.lat(), lng: center.lng() } : null;

      try {
        const response = await apiClient.get('/locations/google-search', {
          params: { query, ...(location && { lat: location.lat, lng: location.lng }) }
        });
        
        if (response.success && response.data.length > 0) {
          alert(`Found ${response.data.length} places. You can import them via the API.`);
        } else {
          alert('No places found');
        }
      } catch (error) {
        alert('Error searching Google Places: ' + error.message);
      }
    };

    // Apply filters
    const applyFilters = () => {
      loadLocations();
    };

    // Watch for location changes
    watch(filteredLocations, () => {
      updateMarkers();
    });

    onMounted(() => {
      loadGoogleMaps();
    });

    return {
      mapContainer,
      locations,
      filteredLocations,
      loading,
      error,
      filters,
      selectedLocation,
      amenities,
      reviews,
      reviewsLoading,
      getCurrentLocation,
      searchGooglePlaces,
      applyFilters,
      focusLocation
    };
  }
};
</script>

<style scoped>
.map-view {
  height: calc(100vh - 80px);
  position: relative;
}

.map-container {
  display: flex;
  height: 100%;
  gap: 1rem;
}

#map {
  flex: 1;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.map-controls {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.control-panel,
.location-list-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.control-panel h3,
.location-list-panel h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-locate,
.btn-google {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-locate {
  background-color: #3498db;
  color: white;
}

.btn-locate:hover {
  background-color: #2980b9;
}

.btn-google {
  background-color: #27ae60;
  color: white;
}

.btn-google:hover {
  background-color: #229954;
}

.location-items {
  max-height: 500px;
  overflow-y: auto;
}

.location-item {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.location-item:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.location-item.active {
  border-color: #667eea;
  background-color: #e8ebff;
}

.location-item h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.address {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.location-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: white;
  background-color: #95a5a6;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #7f8c8d;
}

.close-btn:hover {
  color: #2c3e50;
}

.location-details {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.detail-item {
  margin-bottom: 0.5rem;
}

.amenities {
  margin: 1rem 0;
}

.amenity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.amenity-tag {
  padding: 0.5rem 1rem;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.9rem;
}

.reviews-section {
  margin-top: 1rem;
}

.review-item {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.review-date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.review-text {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.review-scores {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #555;
}

.no-reviews {
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
}
</style>

