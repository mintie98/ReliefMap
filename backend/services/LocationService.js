const locationRepository = require('../repositories/LocationRepository');
const userRepository = require('../repositories/UserRepository');
const axios = require('axios');

class LocationService {
  // Search locations with filters
  async searchLocations(filters) {
    try {
      const locations = await locationRepository.findAll(filters);
      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }

  // Get location details by ID
  async getLocationById(locationId) {
    try {
      const location = await locationRepository.findById(locationId);
      if (!location) {
        return {
          success: false,
          message: 'Location not found'
        };
      }
      return {
        success: true,
        data: location
      };
    } catch (error) {
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  // Search locations from Google Places API
  async searchFromGoogleAPI(query, location = null) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&type=establishment`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=5000`;
      }

      const response = await axios.get(url);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google API error: ${response.data.status}`);
      }

      // Transform Google Places data to our format
      const places = response.data.results.map(place => ({
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        source_name: 'google_places',
        source_id: place.place_id,
        is_official: true
      }));

      return {
        success: true,
        data: places
      };
    } catch (error) {
      throw new Error(`Failed to search Google API: ${error.message}`);
    }
  }

  // Import location from Google API
  async importFromGoogleAPI(placeData) {
    try {
      const locationId = await locationRepository.createFromBase(placeData);
      return {
        success: true,
        data: { location_id: locationId },
        message: 'Location imported successfully'
      };
    } catch (error) {
      throw new Error(`Failed to import location: ${error.message}`);
    }
  }

  // Create location from UGC
  async createFromUGC(ugcData) {
    try {
      // Verify user exists
      const user = await userRepository.findById(ugcData.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const locationId = await locationRepository.createFromUGC(ugcData);
      
      // Log contribution
      await userRepository.incrementContribution(ugcData.user_id);

      return {
        success: true,
        data: { location_id: locationId },
        message: 'Location created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }

  // Update location
  async updateLocation(locationId, updateData) {
    try {
      const updated = await locationRepository.update(locationId, updateData);
      if (!updated) {
        return {
          success: false,
          message: 'Location not found or no changes made'
        };
      }
      return {
        success: true,
        message: 'Location updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  // Delete location
  async deleteLocation(locationId) {
    try {
      const deleted = await locationRepository.delete(locationId);
      if (!deleted) {
        return {
          success: false,
          message: 'Location not found'
        };
      }
      return {
        success: true,
        message: 'Location deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete location: ${error.message}`);
    }
  }

  // Search locations by text
  async searchByText(searchTerm) {
    try {
      const locations = await locationRepository.search(searchTerm);
      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }
}

module.exports = new LocationService();

