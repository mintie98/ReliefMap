const amenityService = require('../services/AmenityService');

class AmenityController {
  async getAmenitiesByLocation(req, res, next) {
    try {
      const { locationId } = req.params;
      const result = await amenityService.getAmenitiesByLocation(locationId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createAmenities(req, res, next) {
    try {
      const { locationId } = req.params;
      const amenityData = req.body;

      const result = await amenityService.createAmenities(locationId, amenityData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateAmenities(req, res, next) {
    try {
      const { locationId } = req.params;
      const amenityData = req.body;

      const result = await amenityService.updateAmenities(locationId, amenityData);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AmenityController();

