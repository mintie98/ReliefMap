const locationService = require('../services/LocationService');

class LocationController {
  async searchLocations(req, res, next) {
    try {
      const filters = {
        lat: parseFloat(req.query.lat),
        lng: parseFloat(req.query.lng),
        radius: parseFloat(req.query.radius), // in km
        verificationStatus: req.query.verification_status,
        sourceType: req.query.source_type
      };

      const result = await locationService.searchLocations(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLocationById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await locationService.getLocationById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchGoogleAPI(req, res, next) {
    try {
      const { query, lat, lng } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }

      const location = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
      const result = await locationService.searchFromGoogleAPI(query, location);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async importFromGoogle(req, res, next) {
    try {
      const placeData = req.body;
      
      if (!placeData.name || !placeData.latitude || !placeData.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, latitude, longitude'
        });
      }

      const result = await locationService.importFromGoogleAPI(placeData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createFromUGC(req, res, next) {
    try {
      const ugcData = {
        ...req.body,
        user_id: req.user?.user_id || req.body.user_id // Assuming auth middleware sets req.user
      };

      if (!ugcData.name || !ugcData.latitude || !ugcData.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, latitude, longitude'
        });
      }

      const result = await locationService.createFromUGC(ugcData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await locationService.updateLocation(id, updateData);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteLocation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await locationService.deleteLocation(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchByText(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query parameter (q) is required'
        });
      }

      const result = await locationService.searchByText(q);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LocationController();

