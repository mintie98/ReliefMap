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
        <span class="refine-search-icon">{{ ICONS.SEARCH }}</span>
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
          <span class="icon">{{ ICONS.CLOCK }}</span> {{ $t('refine_filter.available_time') }}
        </div>
        <div class="time-selector-row">
            <button class="btn-option time-btn" :class="{ active: !!filters.visitTime }" @click="openTimePicker">
              {{ filters.visitTime ? filters.visitTime : $t('refine_filter.visit_time') }} 
              <span v-if="filters.visitTime" class="time-value"></span>
            </button>
            <button v-if="filters.visitTime" class="btn-clear-time" @click.stop="clearVisitTime">✕</button>
        </div>
      </div>

      <hr class="divider">

      <!-- Section: Verification Status -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon" style="color:#10B981">{{ ICONS.CHECK_VERIFIED }}</span> {{ $t('refine_filter.verification_status') }}
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item red-text">
            <input type="checkbox" v-model="filters.status.unverified">
            <span class="checkmark"></span>
            {{ $t('location_detail.unverified') }}
          </label>
          <label class="checkbox-item yellow-text">
            <input type="checkbox" v-model="filters.status.inReview">
            <span class="checkmark"></span>
            {{ $t('location_detail.in_review') }}
          </label>
          <label class="checkbox-item green-text">
            <input type="checkbox" v-model="filters.status.verified">
            <span class="checkmark"></span>
            {{ $t('location_detail.verified') }}
          </label>
        </div>
      </div>

      <hr class="divider">

      <!-- Section: Features -->
      <div class="filter-section">
        <div class="section-label">
          <span class="icon" style="color:#F43F5E">{{ ICONS.CHECK_FEATURE }}</span> {{ $t('refine_filter.features') }}
        </div>
        <div class="features-grid">
          <button 
            v-for="feature in featureList" 
            :key="feature.key"
            class="btn-feature"
            :class="{ active: filters.features[feature.key] }"
            @click="toggleFeature(feature.key)"
          >
            {{ getFeatureLabel(feature.key) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="filter-footer">
      <button class="btn-search" @click="applyFilters">{{ $t('refine_filter.search') }}</button>
    </div>

    <!-- Time Picker Modal -->
    <ScrollTimePicker 
      v-if="showTimePicker"
      :title="$t('refine_filter.visit_time')"
      :initial-time="filters.visitTime || '12:00'"
      @close="showTimePicker = false"
      @confirm="handleTimeConfirm"
    />
  </div>
</template>

<script>
import { useRefineFilter } from '../composables/useRefineFilter';
import { useI18n } from 'vue-i18n';
import ScrollTimePicker from './ScrollTimePicker.vue';
import { ref } from 'vue';
import '../assets/styles/RefineFilter.css';

export default {
  name: 'RefineFilter',
  components: { ScrollTimePicker },
  props: {
    sidebarMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'search'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const {
      filters,
      featureList,
      toggleFeature,
      applyFilters,
      ICONS
    } = useRefineFilter(emit);

    const getFeatureLabel = (key) => {
      return t(`refine_filter.feature_list.${key}`);
    };

    const showTimePicker = ref(false);
    const openTimePicker = () => {
        showTimePicker.value = true;
    };
    const handleTimeConfirm = (time) => {
        filters.visitTime = time;
        showTimePicker.value = false;
    };
    const clearVisitTime = () => {
        filters.visitTime = null;
    };

    return {
      filters,
      featureList,
      toggleFeature,
      applyFilters,
      ICONS,
      getFeatureLabel,
      showTimePicker,
      openTimePicker,
      handleTimeConfirm,
      clearVisitTime
    };
  }
};
</script>
