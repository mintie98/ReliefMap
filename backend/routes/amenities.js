const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/AmenityController');

// Get amenities by location
router.get('/location/:locationId', amenityController.getAmenitiesByLocation.bind(amenityController));

// Create amenities
router.post('/location/:locationId', amenityController.createAmenities.bind(amenityController));

// Update amenities
router.put('/location/:locationId', amenityController.updateAmenities.bind(amenityController));

module.exports = router;

