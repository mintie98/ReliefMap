import apiClient from './api';
import { Location } from '../models/Location';

class LocationService {
  /**
   * Search locations with filters
   */
  async searchLocations(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.lat) params.append('lat', filters.lat);
      if (filters.lng) params.append('lng', filters.lng);
      if (filters.radius) params.append('radius', filters.radius);
      if (filters.verificationStatus) params.append('verification_status', filters.verificationStatus);
      if (filters.sourceType) params.append('source_type', filters.sourceType);

      const response = await apiClient.get(`/locations/search?${params.toString()}`);
      return {
        success: response.success,
        data: response.data.map(loc => new Location(loc)),
        count: response.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get location by ID
   */
  async getLocationById(locationId) {
    try {
      const response = await apiClient.get(`/locations/${locationId}`);
      return {
        success: response.success,
        data: response.data ? new Location(response.data) : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Search Google Places API
   */
  async searchGoogleAPI(query, location = null) {
    try {
      const params = new URLSearchParams({ query });
      if (location) {
        params.append('lat', location.lat);
        params.append('lng', location.lng);
      }

      const response = await apiClient.get(`/locations/google-search?${params.toString()}`);
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Import location from Google API
   */
  async importFromGoogle(placeData) {
    try {
      const response = await apiClient.post('/locations/import-google', placeData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create location from UGC
   */
  async createFromUGC(ugcData) {
    try {
      const response = await apiClient.post('/locations/ugc', ugcData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search locations by text
   */
  async searchByText(searchTerm) {
    try {
      const response = await apiClient.get(`/locations/search-text?q=${encodeURIComponent(searchTerm)}`);
      return {
        success: response.success,
        data: response.data.map(loc => new Location(loc)),
        count: response.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default new LocationService();

