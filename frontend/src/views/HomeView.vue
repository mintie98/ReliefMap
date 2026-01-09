<template>
  <div class="dashboard-container">
    <AppHeader />



    <!-- Main Content -->
    <main class="main-content container">
      <div class="split-layout">
        <!-- Left Column: Map Silhouette -->
        <div class="map-silhouette-container">
          <img :src="japanMapImg" alt="Japan Map" class="japan-map-img" />
          <!-- Pins could be overlaid absolute if needed, for now just the map as requested -->
        </div>

        <!-- Right Column: Category Grid -->
        <div class="categories-grid-container">
          <div class="categories-grid">
            
            <!-- Toilet (Active) -->
            <div class="category-item" @click="navigateToMap">
              <div class="icon-circle red">
                <span class="icon">🚽</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Toilet</span>
            </div>

            <!-- Travel Checkin -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">📷</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Travel Checkin</span>
            </div>

            <!-- Hot Spring -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">♨️</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Hot Spring</span>
            </div>

            <!-- Disaster Prevention -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">⛑️</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Disaster prevention<br>and evacuation</span>
            </div>

            <!-- Fishing Ground -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">🎣</span>
                <div class="pin-point"></div>
              </div>
              <span class="category-label">Fishing ground</span>
            </div>

            <!-- Camping -->
            <div class="category-item">
              <div class="icon-circle red">
                <span class="icon">⛺</span>
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
import { useRouter } from 'vue-router';
import japanMapImg from '../assets/japan_map.png';
import AppHeader from '../components/AppHeader.vue';

export default {
  name: 'HomeView',
  components: {
    AppHeader
  },
  setup() {
    const router = useRouter();
    const navigateToMap = () => {
      router.push('/map');
    };
    const navigateToLogin = () => {
      router.push('/login');
    };

    return {
      navigateToMap,
      japanMapImg
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  height: 60px;
  background-color: #1976D2; /* Solid Blue matched from image */
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

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

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  color: white; /* Explicitly set white */
}

.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Menu Drawer */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 100;
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

.close-menu-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #555;
}

.menu-items {
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.menu-btn {
  width: 100%;
  padding: 1rem;
  background-color: #E0E0E0; /* Light Gray matched from image */
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

/* Transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.split-layout {
  display: flex;
  width: 100%;
  max-width: 1200px;
  gap: 4rem;
  align-items: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Left Column: Map */
.map-silhouette-container {
  flex: 1.2;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.japan-map-img {
  width: 100%;
  max-width: 450px; /* Adjusted for image */
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
  object-fit: contain;
}



/* Right Column: Grid */
.categories-grid-container {
  flex: 1;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 columns */
  column-gap: 2rem;
  row-gap: 3rem;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.category-item:hover {
  transform: translateY(-5px);
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid #D32F2F; /* Red border */
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.icon {
  font-size: 2.5rem;
}

.pin-point {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0; 
  height: 0; 
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 15px solid #D32F2F;
}

.category-label {
  font-weight: 700;
  color: #555;
  font-size: 1.1rem;
  line-height: 1.3;
}

@media (max-width: 900px) {
  .split-layout {
    flex-direction: column;
  }
  
  .map-silhouette-container {
    max-height: 400px;
  }
  
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
