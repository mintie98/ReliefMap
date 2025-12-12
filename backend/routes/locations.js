const express = require('express');
const router = express.Router();
const locationController = require('../controllers/LocationController');

// Search locations with filters
router.get('/search', locationController.searchLocations.bind(locationController));

// Search locations by text
router.get('/search-text', locationController.searchByText.bind(locationController));

// Search Google Places API
router.get('/google-search', locationController.searchGoogleAPI.bind(locationController));

// Get location by ID
router.get('/:id', locationController.getLocationById.bind(locationController));

// Import location from Google API
router.post('/import-google', locationController.importFromGoogle.bind(locationController));

// Create location from UGC
router.post('/ugc', locationController.createFromUGC.bind(locationController));

// Update location
router.put('/:id', locationController.updateLocation.bind(locationController));

// Delete location
router.delete('/:id', locationController.deleteLocation.bind(locationController));

module.exports = router;

