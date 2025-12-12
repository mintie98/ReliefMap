const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');

// Get reviews by location
router.get('/location/:locationId', reviewController.getReviewsByLocation.bind(reviewController));

// Create review
router.post('/', reviewController.createReview.bind(reviewController));

// Update review
router.put('/:id', reviewController.updateReview.bind(reviewController));

// Delete review
router.delete('/:id', reviewController.deleteReview.bind(reviewController));

// Add image to review
router.post('/:reviewId/images', reviewController.addReviewImage.bind(reviewController));

module.exports = router;

