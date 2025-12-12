const amenityRepository = require('../repositories/AmenityRepository');

class AmenityService {
  async getAmenitiesByLocation(locationId) {
    try {
      const amenities = await amenityRepository.findByLocationId(locationId);
      return {
        success: true,
        data: amenities
      };
    } catch (error) {
      throw new Error(`Failed to get amenities: ${error.message}`);
    }
  }

  async createAmenities(locationId, amenityData) {
    try {
      // Check if amenities already exist
      const existing = await amenityRepository.findByLocationId(locationId);
      if (existing) {
        return {
          success: false,
          message: 'Amenities already exist for this location. Use update instead.'
        };
      }

      await amenityRepository.create(locationId, amenityData);
      return {
        success: true,
        message: 'Amenities created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create amenities: ${error.message}`);
    }
  }

  async updateAmenities(locationId, amenityData) {
    try {
      const existing = await amenityRepository.findByLocationId(locationId);
      if (!existing) {
        // Create if doesn't exist
        await amenityRepository.create(locationId, amenityData);
        return {
          success: true,
          message: 'Amenities created successfully'
        };
      }

      const updated = await amenityRepository.update(locationId, amenityData);
      if (!updated) {
        return {
          success: false,
          message: 'Failed to update amenities'
        };
      }

      return {
        success: true,
        message: 'Amenities updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update amenities: ${error.message}`);
    }
  }
}

module.exports = new AmenityService();

