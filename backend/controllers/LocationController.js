const locationService = require('../services/LocationService');

class LocationController {
  async searchLocations(req, res, next) {
    try {
      const parseNum = (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      };

      const filters = {
        lat: parseNum(req.query.lat),
        lng: parseNum(req.query.lng),
        radius: parseNum(req.query.radius), // in km
        swLat: parseNum(req.query.swLat),
        swLng: parseNum(req.query.swLng),
        neLat: parseNum(req.query.neLat),
        neLng: parseNum(req.query.neLng),
        verificationStatus: req.query.verificationStatus, // Note: camelCase matches frontend axios params usually, or check if axios converts. Frontend sends `verificationStatus` key.
        sourceType: req.query.sourceType,
        searchTerm: req.query.searchTerm,
        openNow: req.query.openNow === 'true' || req.query.openNow === true,
        amenities: req.query.amenities // Express parses amenities[key]=true as object
      };

      // Handle nested object if passed as JSON string (sometimes helpful)
      if (typeof req.query.amenities === 'string') {
        try { filters.amenities = JSON.parse(req.query.amenities); } catch (e) { }
      }

      const result = await locationService.searchLocations(filters);
      res.json(result);
    } catch (error) {
      console.error('SearchLocationsController Error:', error);
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
          code: 'MISSING_QUERY',
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
          code: 'MISSING_FIELDS',
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
          code: 'MISSING_FIELDS',
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
          code: 'MISSING_QUERY',
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

