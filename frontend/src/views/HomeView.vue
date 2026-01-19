<template>
  <div class="dashboard-container">
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content container">
      <div class="split-layout">
        <!-- Left Column: Map Silhouette -->
        <div class="map-silhouette-container">
          <img :src="japanMapImg" alt="Japan Map" class="japan-map-img" />
          <!-- Decorative Pins - Spread out across Japan silhouette -->
          <div class="map-pin" style="top: 18%; left: 78%;">
            <img :src="pinMedical" alt="medical" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 35%; left: 68%;" @click="navigateToMap">
            <img :src="pinToilet" alt="toilet" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 48%; left: 65%;">
            <img :src="pinCamera" alt="camera" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 58%; left: 56%;">
            <img :src="pinOnsen" alt="onsen" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 68%; left: 45%;">
            <img :src="pinFishing" alt="fishing" class="pin-img" />
          </div>
          <div class="map-pin" style="top: 78%; left: 35%;">
            <img :src="pinCampingNew" alt="camping" class="pin-img" />
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
                <span class="icon icon-travel">{{ ICONS.TRAVEL_CHECKIN }}</span>
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
                <span class="icon icon-camping">{{ ICONS.CAMPING }}</span>
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
    const { 
      navigateToMap, 
      japanMapImg, 
      pinToilet, 
      pinCamera, 
      pinMedical, 
      pinFishing, 
      pinOnsen,
      pinCampingNew,
      ICONS 
    } = useHomeView();

    return {
      navigateToMap,
      japanMapImg,
      pinToilet,
      pinCamera,
      pinMedical,
      pinFishing,
      pinOnsen,
      pinCampingNew,
      ICONS
    };
  }
};
</script>
