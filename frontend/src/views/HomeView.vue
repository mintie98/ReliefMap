<template>
  <div class="dashboard-container">
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content container">
      <div class="split-layout">
        <!-- Left Column: Map Silhouette -->
        <div class="map-silhouette-container">
          <img :src="japanMapImg" alt="Japan Map" class="japan-map-img" />
        </div>

        <!-- Right Column: Category Grid -->
        <div class="categories-grid-container">
          <div class="categories-grid">
            
            <!-- Toilet (Active) -->
            <div class="category-item" @click="navigateToMap">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.TOILET }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Toilet</span>
            </div>

            <!-- Travel Checkin -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.TRAVEL_CHECKIN }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Travel Checkin</span>
            </div>

            <!-- Hot Spring -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.HOT_SPRING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Hot Spring</span>
            </div>

            <!-- Disaster Prevention -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.DISASTER_PREVENTION }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Disaster prevention<br>and evacuation</span>
            </div>

            <!-- Fishing Ground -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.FISHING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Fishing ground</span>
            </div>

            <!-- Camping -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.CAMPING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Camping</span>
            </div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue';
import { useHomeView } from '../composables/useHomeView';
import '../assets/styles/HomeView.css';

export default {
  name: 'HomeView',
  components: {
    AppHeader
  },
  setup() {
    const { navigateToMap, japanMapImg, ICONS } = useHomeView();

    return {
      navigateToMap,
      japanMapImg,
      ICONS
    };
  }
};
</script>
