<template>
  <div class="refine-filter-overlay" :class="{ 'sidebar-mode': sidebarMode }">
    <!-- Header -->
    <div class="filter-header">
      <button class="btn-back" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <div class="search-input-container">
        <span class="search-icon">{{ ICONS.SEARCH }}</span>
        <input 
          type="text" 
          v-model="filters.searchText"
          placeholder="etc,name,..." 
          class="header-search-input"
        >
      </div>
    </div>

    <div class="filter-content scroller">
      <!-- Section: Available Time -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon">{{ ICONS.CLOCK }}</span> Available Time
        </div>
        <button class="btn-option" :class="{ active: filters.visitTime }" @click="filters.visitTime = !filters.visitTime">
          Visit time
        </button>
      </div>

      <hr class="divider">

      <!-- Section: Verification Status -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon" style="color:#10B981">{{ ICONS.CHECK_VERIFIED }}</span> Verification Status
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item red-text">
            <input type="checkbox" v-model="filters.status.unverified">
            <span class="checkmark"></span>
            Unverified
          </label>
          <label class="checkbox-item yellow-text">
            <input type="checkbox" v-model="filters.status.inReview">
            <span class="checkmark"></span>
            In Review
          </label>
          <label class="checkbox-item green-text">
            <input type="checkbox" v-model="filters.status.verified">
            <span class="checkmark"></span>
            Verified
          </label>
        </div>
      </div>

      <hr class="divider">

      <!-- Section: Features -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon" style="color:#F43F5E">{{ ICONS.CHECK_FEATURE }}</span> Features
        </div>
        <div class="features-grid">
          <button 
            v-for="feature in featureList" 
            :key="feature.key"
            class="btn-feature"
            :class="{ active: filters.features[feature.key] }"
            @click="toggleFeature(feature.key)"
          >
            {{ feature.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="filter-footer">
      <button class="btn-search" @click="applyFilters">search</button>
    </div>
  </div>
</template>

<script>
import { useRefineFilter } from '../composables/useRefineFilter';
import '../assets/styles/RefineFilter.css';

export default {
  name: 'RefineFilter',
  props: {
    sidebarMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'search'],
  setup(props, { emit }) {
    const {
      filters,
      featureList,
      toggleFeature,
      applyFilters,
      ICONS
    } = useRefineFilter(emit);

    return {
      filters,
      featureList,
      toggleFeature,
      applyFilters,
      ICONS
    };
  }
};
</script>
