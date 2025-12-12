import { ref, reactive, computed } from 'vue';
import locationService from '../services/LocationService';
import { Location } from '../models/Location';

/**
 * LocationViewModel
 * Manages state and business logic for locations
 */
export function useLocationViewModel() {
  // State
  const locations = ref([]);
  const currentLocation = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const filters = reactive({
    lat: null,
    lng: null,
    radius: 5, // km
    verificationStatus: null,
    sourceType: null
  });
  const searchTerm = ref('');

  // Computed
  const filteredLocations = computed(() => {
    let result = locations.value;

    if (filters.verificationStatus) {
      result = result.filter(loc => loc.verification_status === filters.verificationStatus);
    }

    if (filters.sourceType) {
      result = result.filter(loc => loc.source_type === filters.sourceType);
    }

    if (filters.lat && filters.lng) {
      result = result.map(loc => ({
        ...loc,
        distance: loc.getDistanceFrom(filters.lat, filters.lng)
      })).sort((a, b) => a.distance - b.distance);
    }

    return result;
  });

  const verifiedLocations = computed(() => {
    return locations.value.filter(loc => loc.isVerified());
  });

  // Methods
  const loadLocations = async (newFilters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const searchFilters = { ...filters, ...newFilters };
      const result = await locationService.searchLocations(searchFilters);
      
      if (result.success) {
        locations.value = result.data;
      } else {
        error.value = result.error || 'Failed to load locations';
        locations.value = [];
      }
    } catch (err) {
      error.value = err.message;
      locations.value = [];
    } finally {
      loading.value = false;
    }
  };

  const loadLocationById = async (locationId) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await locationService.getLocationById(locationId);
      
      if (result.success && result.data) {
        currentLocation.value = result.data;
      } else {
        error.value = result.error || 'Location not found';
        currentLocation.value = null;
      }
    } catch (err) {
      error.value = err.message;
      currentLocation.value = null;
    } finally {
      loading.value = false;
    }
  };

  const searchLocations = async (term) => {
    if (!term.trim()) {
      await loadLocations();
      return;
    }

    loading.value = true;
    error.value = null;
    searchTerm.value = term;

    try {
      const result = await locationService.searchByText(term);
      
      if (result.success) {
        locations.value = result.data;
      } else {
        error.value = result.error || 'Search failed';
        locations.value = [];
      }
    } catch (err) {
      error.value = err.message;
      locations.value = [];
    } finally {
      loading.value = false;
    }
  };

  const searchGoogleAPI = async (query, location = null) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await locationService.searchGoogleAPI(query, location);
      return result;
    } catch (err) {
      error.value = err.message;
      return { success: false, data: [] };
    } finally {
      loading.value = false;
    }
  };

  const createLocation = async (ugcData) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await locationService.createFromUGC(ugcData);
      
      if (result.success) {
        // Reload locations
        await loadLocations();
        return result;
      } else {
        error.value = result.error || 'Failed to create location';
        return result;
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateFilters = (newFilters) => {
    Object.assign(filters, newFilters);
  };

  const clearFilters = () => {
    filters.lat = null;
    filters.lng = null;
    filters.radius = 5;
    filters.verificationStatus = null;
    filters.sourceType = null;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    locations,
    currentLocation,
    loading,
    error,
    filters,
    searchTerm,
    
    // Computed
    filteredLocations,
    verifiedLocations,
    
    // Methods
    loadLocations,
    loadLocationById,
    searchLocations,
    searchGoogleAPI,
    createLocation,
    updateFilters,
    clearFilters,
    clearError
  };
}

