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
        <span class="search-icon">🔍</span>
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
          <span class="icon">🕒</span> Available Time
        </div>
        <button class="btn-option" :class="{ active: filters.visitTime }" @click="filters.visitTime = !filters.visitTime">
          Visit time
        </button>
      </div>

      <hr class="divider">

      <!-- Section: Verification Status -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon" style="color:#10B981">✅</span> Verification Status
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
          <span class="icon" style="color:#F43F5E">🏷️</span> Features
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
import { reactive } from 'vue';

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
    const filters = reactive({
      searchText: '',
      visitTime: false,
      status: {
        unverified: false,
        inReview: false,
        verified: false
      },
      features: {}
    });

    const featureList = [
      { key: 'japanese', label: 'Japanese-style' },
      { key: 'western', label: 'Western-style' },
      { key: 'washlet', label: 'Washlet/Bidet' },
      { key: 'public', label: 'Public Toilet' },
      { key: 'diaper', label: 'Diaper Changing' },
      { key: 'wheelchair', label: 'Wheelchair' },
      { key: 'child_seat', label: 'Child Seat' },
      { key: 'parking', label: 'Parking' }
    ];

    // Initialize features state
    featureList.forEach(f => {
      filters.features[f.key] = false;
    });

    const toggleFeature = (key) => {
      filters.features[key] = !filters.features[key];
    };

    const applyFilters = () => {
      emit('search', filters);
    };

    return {
      filters,
      featureList,
      toggleFeature,
      applyFilters
    };
  }
};
</script>

<style scoped>
.refine-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 2000; /* Higher than drawer */
  display: flex;
  flex-direction: column;
}

/* Sidebar Mode Styles */
.refine-filter-overlay.sidebar-mode {
  position: static;
  width: 100%;
  height: 100%;
  z-index: auto;
}

/* Header */
.filter-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.5rem;
  border-bottom: 1px solid #eee;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.search-input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #999;
}

.header-search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background-color: #f5f5f5;
  border: none;
  border-radius: 24px;
  font-size: 0.95rem;
  outline: none;
}

/* Content */
.filter-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 1rem;
}

.section-label {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.icon {
  font-size: 1.2rem;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 0.8rem 0;
}

/* Options */
.btn-option {
  background-color: #E0E0E0;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  cursor: pointer;
}

.btn-option.active {
  background-color: #1976D2;
  color: white;
}

/* Checkboxes */
.checkbox-group {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  position: relative;
}

.checkbox-item input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 2px solid #333;
}

.red-text { color: #F43F5E; }
.yellow-text { color: #F59E0B; }
.green-text { color: #10B981; }

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.btn-feature {
  background-color: #E0E0E0;
  border: none;
  padding: 0.6rem 0.4rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-feature:hover {
  background-color: #d5d5d5;
}

.btn-feature.active {
  background-color: #e3effb; /* Very light blue */
  border: 1px solid #1976D2; 
  color: #1976D2;
}

/* Footer */
.filter-footer {
  padding: 1rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
}

.btn-search {
  background-color: #1976D2;
  color: white;
  width: 100%;
  max-width: 180px;
  padding: 0.6rem;
  border: none;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
}

.btn-search:hover {
  background-color: #bbb;
}
</style>
