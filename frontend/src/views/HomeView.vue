<template>
  <div class="dashboard-container">
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content container">
      <div class="split-layout">
        <!-- Left Column: Map Silhouette -->
        <div class="map-silhouette-container">
          <img :src="japanMapImg" alt="Japan Map" class="japan-map-img" />
          <!-- Decorative Pins -->
          <div class="map-pin" style="top: 40%; left: 64%;">
            <img :src="pinGreen" alt="pin" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 52%; left: 61%;">
            <img :src="pinRed" alt="pin" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 48%; left: 63%;">
            <img :src="pinYellow" alt="pin" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 25%; left: 62%;">
            <img :src="pinGreen" alt="pin" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 65%; left: 56%;">
            <img :src="pinYellow" alt="pin" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 44%; left: 64%;">
            <img :src="pinRed" alt="pin" class="pin-img" />
          </div>
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
              <span class="category-label">{{ $t('home.categories.toilet') }}</span>
            </div>

            <!-- Travel Checkin -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.TRAVEL_CHECKIN }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">{{ $t('home.categories.travel_checkin') }}</span>
            </div>

            <!-- Hot Spring -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.HOT_SPRING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">{{ $t('home.categories.hot_spring') }}</span>
            </div>

            <!-- Disaster Prevention -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.DISASTER_PREVENTION }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label" style="white-space: pre-line;">{{ $t('home.categories.disaster_prevention') }}</span>
            </div>

            <!-- Fishing Ground -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.FISHING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">{{ $t('home.categories.fishing') }}</span>
            </div>

            <!-- Camping -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">{{ ICONS.CAMPING }}</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">{{ $t('home.categories.camping') }}</span>
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
    const { navigateToMap, japanMapImg, pinGreen, pinYellow, pinRed, ICONS } = useHomeView();

    return {
      navigateToMap,
      japanMapImg,
      pinGreen,
      pinYellow,
      pinRed,
      ICONS
    };
  }
};
</script>
