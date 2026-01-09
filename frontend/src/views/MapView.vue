<template>
  <div class="map-view-layout">
    <!-- Top Header -->
    <header class="map-header">
      <div class="header-left">
         <button class="hamburger-btn" @click="isMenuOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 class="brand-text">Relief Map</h1>
      </div>
      
      <div class="header-right">
        <div class="user-profile">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="username">guest</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </header>

    <!-- Menu Drawer Overlay -->
    <transition name="slide-fade">
      <div v-if="isMenuOpen" class="menu-overlay" @click.self="isMenuOpen = false">
        <div class="menu-drawer">
          <div class="drawer-header">
             <button class="close-menu-btn" @click="isMenuOpen = false">×</button>
          </div>
          <div class="menu-items">
            <button class="menu-btn" @click="openRefine">
              <span class="menu-icon">🔍</span>
              Refine
            </button>
            <button class="menu-btn" @click="openAddLocation">
              <span class="menu-icon">➕</span>
              Add new toilet
            </button>
            <button class="menu-btn">
              <span class="menu-icon">📝</span>
              Review toilet
            </button>
            <button class="menu-btn">
              <span class="menu-icon">❓</span>
              FAQ
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Refine Filter Full Screen -->
    <RefineFilter 
      v-if="showRefine" 
      @close="showRefine = false"
      @search="handleRefineSearch"
    />

    <!-- Add Location Modal -->
    <AddLocationModal 
      v-if="showAddModal" 
      @close="showAddModal = false"
      @added="handleLocationAdded"
    />

    <!-- Main Map Area -->
    <main class="map-container">
      <div id="map" ref="mapContainer"></div>
      
      <!-- Floating Controls -->
      <div class="map-controls">
        <button class="control-btn" @click="getCurrentLocation" title="My Location">
          📍
        </button>
        <button class="control-btn" @click="zoomIn" title="Zoom In">
          ➕
        </button>
        <button class="control-btn" @click="zoomOut" title="Zoom Out">
          ➖
        </button>
      </div>

      <!-- Detail Popup (Mobile/Overlay) -->
      <transition name="slide-up">
        <div v-if="selectedLocation" class="location-detail-panel">
          <button class="close-panel" @click="selectedLocation = null">×</button>
          <div class="detail-header">
            <h2>{{ selectedLocation.display_name }}</h2>
            <div class="detail-scores" v-if="selectedLocation.verification_score">
              <span class="score-badge">Trust: {{ selectedLocation.verification_score.toFixed(1) }}</span>
              <span v-if="selectedLocation.source_type === 'api'" class="source-badge">
                Source: Google Maps {{ selectedLocation.verification_score > 0.5 ? '| Updated by ReliefMap' : '' }}
              </span>
              <span v-else class="source-badge">Source: Community</span>
            </div>
          </div>
          <div class="detail-body scroller">
             <p class="detail-address">{{ selectedLocation.address }}</p>
             <!-- Reviews Placeholders -->
             <div class="detail-actions">
               <button class="btn btn-primary btn-full">Navigate</button>
             </div>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import RefineFilter from '../components/RefineFilter.vue';
import AddLocationModal from '../components/AddLocationModal.vue';
import apiClient from '../services/api';

import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';

export default {
  name: 'MapView',
  components: { RefineFilter, AddLocationModal },
  setup() {
    const mapContainer = ref(null);
    const isMenuOpen = ref(false);
    const showRefine = ref(false);
    let map = null;
    let markers = [];
    
    const selectedLocation = ref(null);
    const amenities = ref({}); // Placeholder for client-side filter simulation

    const {
      locations,
      filteredLocations,
      loading,
      error,
      filters,
      loadLocations,
      updateFilters,
      clearFilters: originalClearFilters
    } = useLocationViewModel();

    const hasActiveFilters = computed(() => {
      return filters.verificationStatus || filters.sourceType;
    });

    const initMap = () => {
      console.log('initMap called');
      if (!window.google || !mapContainer.value) return;
      const defaultCenter = { lat: 35.6762, lng: 139.6503 };
      
      map = new window.google.maps.Map(mapContainer.value, {
        zoom: 14,
        center: defaultCenter,
        disableDefaultUI: true, // We build our own controls
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add listener for bounding box search
      map.addListener('idle', () => {
        const bounds = map.getBounds();
        console.log('Map idle, bounds:', bounds);
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          console.log('Updating filters with bounds:', sw.lat(), ne.lat());
          updateFilters({
            swLat: sw.lat(),
            swLng: sw.lng(),
            neLat: ne.lat(),
            neLng: ne.lng()
          });
          loadLocations();
        }
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Geolocation success:', pos.coords);
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setCenter(loc);
            updateFilters({ lat: loc.lat, lng: loc.lng });
            loadLocations();
          },
          (err) => {
            console.error('Geolocation error:', err);
            loadLocations();
          }
        );
      } else {
        loadLocations();
      }
    };

    const updateMarkers = () => {
      console.log('updateMarkers called. Locations:', filteredLocations.value.length);
      if (!map) {
         console.warn('Map not initialized yet');
         return;
      }
      markers.forEach(m => m.setMap(null));
      markers = [];

      filteredLocations.value.forEach(loc => {
        const marker = new window.google.maps.Marker({
          position: { lat: loc.latitude, lng: loc.longitude },
          map: map,
          title: loc.display_name,
          icon: {
            url: getPinIcon(loc),
            scaledSize: new window.google.maps.Size(45, 60), 
            anchor: new window.google.maps.Point(22.5, 60)
          }
        });
        marker.addListener('click', () => focusLocation(loc));
        markers.push(marker);
      });
      console.log('Markers created:', markers.length);
    };

    const getPinIcon = (loc) => {
        // API locations are verified (Green)
        if (loc.source_type === 'api') return pinGreen;
        
        // Check verification status
        const status = loc.verification_status;
        if (status === 'verified' || status === 'green') return pinGreen;
        if (status === 'yellow' || status === 'in_review') return pinYellow;
        if (status === 'unverified' || status === 'red') return pinRed;
        
        // Fallback
        return pinYellow; 
    };

    const focusLocation = (loc) => {
      selectedLocation.value = loc;
      if (map) {
        map.panTo({ lat: loc.latitude, lng: loc.longitude });
      }
    };

    const toggleFilter = (key, value) => {
      if (filters[key] === value) {
        updateFilters({ [key]: null });
      } else {
        updateFilters({ [key]: value });
      }
    };

    // Placeholder until amenity filtering is supported in ViewModel
    const toggleAmenity = (key) => {
      console.log('Implement toggle amenity:', key);
    };

    const clearFilters = () => {
      originalClearFilters();
    };

    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(loc);
          map.setZoom(15);
          updateFilters({ lat: loc.lat, lng: loc.lng });
          loadLocations();
        });
      }
    };

    const zoomIn = () => map?.setZoom((map.getZoom() || 14) + 1);
    const zoomOut = () => map?.setZoom((map.getZoom() || 14) - 1);

    const searchGooglePlaces = (e) => {
      const query = e.target.value;
      if(!query) return;
      alert(`Search for: ${query} (Implement API call)`);
      e.target.value = '';
    };

    const showAddModal = ref(false);

    const openRefine = () => {
      isMenuOpen.value = false; // Close drawer
      showRefine.value = true;  // Open refine
    };

    const openAddLocation = () => {
        isMenuOpen.value = false;
        showAddModal.value = true;
    };

    const handleLocationAdded = () => {
        // Refresh map or focus on new location
        loadLocations();
    };

    const handleRefineSearch = (filterData) => {
      showRefine.value = false;
      console.log('Search with filters:', filterData);
      
      const newFilters = {};
      if (filterData.status.verified) newFilters.verificationStatus = 'green';
      else if (filterData.status.inReview) newFilters.verificationStatus = 'yellow'; 
      else if (filterData.status.unverified) newFilters.verificationStatus = 'red';
      else newFilters.verificationStatus = null; 
      
      updateFilters(newFilters);
      loadLocations();
    };

    // Load Maps Script
    onMounted(() => {
        if (window.google) {
            initMap();
        } else {
             const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&callback=initReliefMap`;
            script.async = true;
            script.defer = true;
            window.initReliefMap = initMap;
            document.head.appendChild(script);
        }
    });

    watch(filteredLocations, updateMarkers);

    return {
      mapContainer,
      isMenuOpen,
      filters,
      hasActiveFilters,
      amenities,
      loading,
      filteredLocations,
      selectedLocation,
      toggleFilter,
      toggleAmenity,
      clearFilters,
      focusLocation,
      getCurrentLocation,
      zoomIn,
      zoomOut,
      zoomOut,
      searchGooglePlaces,
      showRefine,
      showAddModal,
      openRefine,
      openAddLocation,
      handleRefineSearch,
      handleLocationAdded
    };
  }
};
</script>

<style scoped>
/* Layout */
.map-view-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Header */
.map-header {
  height: 60px;
  background-color: #1976D2; /* Solid Blue */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  margin-left: 0.5rem;
}

.hamburger-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.username {
  font-weight: 600;
  font-size: 1rem;
}

/* Map Container */
.map-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
}

#map {
  width: 100%;
  height: 100%;
}

/* Map Controls */
.map-controls {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 5;
}

/* Note: User wanted Right-side controls in previous iteration, 
   but in the new image (step 185) the controls seem to be on the left or hidden?
   I will keep them floating on the right as per standard or adjust if needed.
   Let's keep them on Left based on the new image? Actually the image is cropped.
   The prompt says "nút vị trí... vẫn giữ nguyên" (keep buttons same). 
   In previous version they were bottom-right or right. 
   I will adapt .map-controls to be consistent. Let's stick to Right side for now as it's cleaner. 
*/
.map-controls {
  position: absolute;
  bottom: 2rem;
  right: 1rem;
  top: auto;
  left: auto;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
}

.control-btn:hover {
  background-color: #f1f5f9;
}

/* Detail Panel */
.location-detail-panel {
  position: absolute;
  bottom: 2rem;
  left: 1rem;
  right: auto;
  width: 350px;
  max-width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 1.5rem;
  z-index: 20;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {

  .location-detail-panel {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    max-width: none;
  }
}

/* Header Left */
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Menu Drawer */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
}

.menu-drawer {
  width: 300px;
  height: 100%;
  background: white;
  padding: 2rem;
  position: relative;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.drawer-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

.close-menu-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #555;
  line-height: 1;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-btn {
  width: 100%;
  padding: 1rem;
  background-color: #E0E0E0;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.menu-btn:hover {
  background-color: #D6D6D6;
}

.menu-icon {
  font-size: 1.2rem;
}

/* Transitions */
.source-badge {
  background-color: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}
</style>
