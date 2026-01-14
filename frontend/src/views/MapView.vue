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
        <h1 class="brand-text" @click="goHome">Relief Map</h1>
      </div>
      
      <div class="header-right">
        <div class="user-profile-container">
          <UserMenu />
        </div>
      </div>
    </header>

    <!-- Menu Drawer Overlay -->
    <transition name="slide-fade">
      <div v-if="isMenuOpen" class="menu-overlay" @click.self="isMenuOpen = false">
        <div class="menu-drawer">
          <!-- Show Refine Filter or Menu Items -->
          <template v-if="!showRefine">
            <div class="drawer-header">
              <button class="back-home-btn" @click="goHome">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Back to Home
              </button>
               <button class="close-menu-btn" @click="isMenuOpen = false">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <polyline points="11 17 6 12 11 7"></polyline>
                   <polyline points="18 17 13 12 18 7"></polyline>
                 </svg>
               </button>
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
              <button class="menu-btn" @click="handleReviewMenuClick">
                <span class="menu-icon">📝</span>
                Review toilet
              </button>
              <button class="menu-btn">
                <span class="menu-icon">❓</span>
                FAQ
              </button>
            </div>
          </template>
          
          <!-- Refine Filter Inside Sidebar -->
          <template v-else>
            <RefineFilter 
              @close="showRefine = false"
              @search="handleRefineSearch"
              :sidebar-mode="true"
            />
          </template>
        </div>
      </div>
    </transition>


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
      <div class="map-controls" :class="{ 'shifted': !!selectedLocation }">
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

      <!-- Detail Popup (Right Sidebar) -->
      <transition name="slide-right">
        <div v-if="selectedLocation" class="location-detail-wrapper">
             <LocationDetailPanel 
                :location="selectedLocation" 
                @close="selectedLocation = null"
                @navigate="handleNavigate"
                @add-review="handleAddReview"
             />
        </div>
      </transition>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import apiClient from '../services/api';
import AddLocationModal from '../components/AddLocationModal.vue';
import RefineFilter from '../components/RefineFilter.vue';
import UserMenu from '../components/UserMenu.vue';
import LocationDetailPanel from '../components/LocationDetailPanel.vue';

import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';

export default {
  name: 'MapView',
  components: { RefineFilter, AddLocationModal, UserMenu, LocationDetailPanel },
  setup() {
    const mapContainer = ref(null);
    const isMenuOpen = ref(false);
    const showRefine = ref(false);
    // New Auth Refs
    // const isUserMenuOpen = ref(false); // Moved to UserMenu
    // const isAuthenticated = ref(false); // Moved to UserMenu

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
      // Keep drawer open, just show refine view
      showRefine.value = true;
    };

    const openAddLocation = () => {
        isMenuOpen.value = false;
        showAddModal.value = true;
    };

    const handleLocationAdded = () => {
        // Refresh map or focus on new location
        loadLocations();
    };

    // Auth Logic
    const router = useRouter();
    const toggleUserMenu = () => {
      isUserMenuOpen.value = !isUserMenuOpen.value;
    };

    const navigateToLogin = () => {
      router.push('/login');
    };

    const handleNavigate = (loc) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
        window.open(url, '_blank');
    };

    const handleReviewMenuClick = () => {
        isMenuOpen.value = false;
        if (selectedLocation.value) {
            // If location selected, just ensure detail panel is open (it has the add review button)
            // But detailed panel might cover map. 
            // Ideally, we focus on the location and maybe wiggle the review button?
            // For now, let's just alert user to select a location IF none selected.
            // If selected, we could programmatically trigger the review modal or just show the panel.
             console.log("Location selected, opening panel");
        } else {
            alert("Please select a location on the map to review.");
        }
    };

    const handleAddReview = () => {
        // This is emitted by detail panel if we wanted to handle it at parent level
        // But DetailPanel currently handles it internally with the Modal. 
        // We can keep this empty or remove it.
        console.log('Detail Panel handles review internally now.');
    };

    const goHome = () => {
      router.push('/');
    };

    /* Moved to UserMenu 
    const handleLogout = () => {
      isAuthenticated.value = false;
      isUserMenuOpen.value = false;
      // In real app, clear tokens, etc.
    }; 
    */

    const handleRefineSearch = (filterData) => {
      showRefine.value = false; // Close refine view, back to menu
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
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&callback=initReliefMap&loading=async&libraries=places`;
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
      openAddLocation,
      handleRefineSearch,
      handleLocationAdded,
      handleNavigate,
      handleRefineSearch,
      handleLocationAdded,
      handleNavigate,
      handleReviewMenuClick,
      handleAddReview,
      // isUserMenuOpen,
      // isAuthenticated,
      // toggleUserMenu,
      navigateToLogin,
      // handleLogout,
      goHome
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
  color: white; /* Ensure white */
  cursor: pointer;
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
  transition: right 0.3s ease;
  z-index: 15; /* Ensure above map but below panels */
}

.map-controls.shifted {
  right: 320px; /* Shift left when panel is open */
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

/* Detail Panel Wrapper */
.location-detail-wrapper {
  position: fixed; /* Fixed to viewport like menu drawer */
  top: 60px;
  bottom: 0;
  right: 0;
  left: auto;
  width: 300px;
  max-width: none;
  height: calc(100vh - 60px);
  background: white;
  border-left: 1px solid #ddd;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  z-index: 1100; /* High z-index to sit above map */
  overflow: hidden; 
  border-radius: 5px 0 0 0; /* Round top-left only or as requested */
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .location-detail-wrapper {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 60vh;
    max-width: none;
    border-radius: 12px 12px 0 0;
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
  top: 60px; /* Start below header */
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px); /* Adjust height */
  background: rgba(0,0,0,0.5);
  z-index: 999; /* Below header (1000) */
  display: flex;
}

.menu-drawer {
  width: 300px;
  height: 100%;
  background: white;
  padding: 0;
  position: relative;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #E2E8F0;
  background-color: #f8f9fa;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #1976D2;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.back-home-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.close-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  line-height: 1;
  padding: 0.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
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
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.source-badge.api {
  background-color: #e0f2fe;
  color: #0284c7;
}

.source-badge.merged {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.source-badge.ugc {
  background-color: #f3e8ff;
  color: #7e22ce;
}

/* Transitions */
.slide-fade-enter-active {
  transition: opacity 0.3s ease;
}

.slide-fade-leave-active {
  transition: opacity 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active .menu-drawer {
  animation: slideIn 0.3s ease;
}

.slide-fade-leave-active .menu-drawer {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

/* User Profile & Dropdown */
.user-profile-container {
  position: relative;
}

.auth-dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  background: white;
  min-width: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.dropdown-item {
  background: none;
  border: none;
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Right Slide Transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>