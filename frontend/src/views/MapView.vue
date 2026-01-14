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
                <span class="menu-icon">{{ ICONS.SEARCH }}</span>
                Refine
              </button>
              <button class="menu-btn" @click="openAddLocation">
                <span class="menu-icon">{{ ICONS.ADD }}</span>
                Add new toilet
              </button>
              <button class="menu-btn" @click="handleReviewMenuClick">
                <span class="menu-icon">{{ ICONS.REVIEW }}</span>
                Review toilet
              </button>
              <button class="menu-btn">
                <span class="menu-icon">{{ ICONS.FAQ }}</span>
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
          {{ ICONS.LOCATION_PIN }}
        </button>
        <button class="control-btn" @click="zoomIn" title="Zoom In">
          {{ ICONS.ZOOM_IN }}
        </button>
        <button class="control-btn" @click="zoomOut" title="Zoom Out">
          {{ ICONS.ZOOM_OUT }}
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
import { useMapView } from '../composables/useMapView';
import AddLocationModal from '../components/AddLocationModal.vue';
import RefineFilter from '../components/RefineFilter.vue';
import UserMenu from '../components/UserMenu.vue';
import LocationDetailPanel from '../components/LocationDetailPanel.vue';

// Import CSS
import '../assets/styles/MapView.css';

export default {
  name: 'MapView',
  components: { RefineFilter, AddLocationModal, UserMenu, LocationDetailPanel },
  setup() {
    const {
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
      searchGooglePlaces,
      showRefine,
      showAddModal,
      openRefine,
      openAddLocation,
      handleRefineSearch,
      handleLocationAdded,
      handleNavigate,
      handleReviewMenuClick,
      handleAddReview,
      navigateToLogin,
      goHome,
      ICONS
    } = useMapView();

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
      searchGooglePlaces,
      showRefine,
      showAddModal,
      openRefine,
      openAddLocation,
      handleRefineSearch,
      handleLocationAdded,
      handleNavigate,
      handleReviewMenuClick,
      handleAddReview,
      navigateToLogin,
      goHome,
      ICONS
    };
  }
};
</script>