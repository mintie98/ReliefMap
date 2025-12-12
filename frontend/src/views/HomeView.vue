<template>
  <div class="home-view">
    <div class="hero-section">
      <h1>Welcome to ReliefMap</h1>
      <p>Find WC locations near you from Google API and user contributions</p>
      <router-link to="/map" class="btn-primary">Explore Map</router-link>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <h3>🔍 Search Locations</h3>
        <p>Search for WC locations using Google Places API or browse user-contributed locations</p>
      </div>
      <div class="feature-card">
        <h3>📍 Verified Data</h3>
        <p>Locations are verified with trust scores and verification status</p>
      </div>
      <div class="feature-card">
        <h3>⭐ Reviews & Ratings</h3>
        <p>Read reviews and see cleanliness and wait time scores</p>
      </div>
      <div class="feature-card">
        <h3>➕ Contribute</h3>
        <p>Add new WC locations and help others find facilities</p>
      </div>
    </div>

    <div class="quick-search-section">
      <h2>Quick Search</h2>
      <div class="search-box">
        <input
          v-model="searchTerm"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Search for WC locations..."
          class="search-input"
        />
        <button @click="handleSearch" class="btn-search">Search</button>
      </div>
      
      <div v-if="loading" class="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="locations.length > 0" class="results">
        <h3>Search Results ({{ locations.length }})</h3>
        <div class="location-list">
          <div
            v-for="location in locations"
            :key="location.location_id"
            class="location-card"
            @click="goToMap(location)"
          >
            <h4>{{ location.display_name }}</h4>
            <p class="address">{{ location.address }}</p>
            <div class="location-meta">
              <span class="status" :style="{ color: location.getStatusColor() }">
                {{ location.verification_status.toUpperCase() }}
              </span>
              <span class="source">{{ location.source_type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter();
    const searchTerm = ref('');
    const {
      locations,
      loading,
      error,
      searchLocations
    } = useLocationViewModel();

    const handleSearch = async () => {
      if (searchTerm.value.trim()) {
        await searchLocations(searchTerm.value);
      }
    };

    const goToMap = (location) => {
      router.push({
        name: 'Map',
        query: {
          lat: location.latitude,
          lng: location.longitude,
          locationId: location.location_id
        }
      });
    };

    return {
      searchTerm,
      locations,
      loading,
      error,
      handleSearch,
      goToMap
    };
  }
};
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

.quick-search-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quick-search-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search {
  padding: 0.75rem 2rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-search:hover {
  background-color: #5568d3;
}

.loading, .error {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
}

.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.results h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.location-list {
  display: grid;
  gap: 1rem;
}

.location-card {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.location-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.location-card h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.address {
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.location-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.status {
  font-weight: bold;
}

.source {
  color: #7f8c8d;
  text-transform: capitalize;
}
</style>

