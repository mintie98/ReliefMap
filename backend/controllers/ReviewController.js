const reviewService = require('../services/ReviewService');

class ReviewController {
  async getReviewsByLocation(req, res, next) {
    try {
      const { locationId } = req.params;
      const result = await reviewService.getReviewsByLocation(locationId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createReview(req, res, next) {
    try {
      console.log('Create Review Request:');
      console.log('Body:', req.body);
      console.log('Files:', req.files);

      let reviewData = {
        ...req.body,
        user_id: req.user?.user_id || req.user?.id || req.body.user_id,
        files: req.files || []
      };

      // Parse JSON fields if they come as strings (common in multipart/form-data)
      if (typeof reviewData.amenities === 'string') {
        try {
          reviewData.amenities = JSON.parse(reviewData.amenities);
        } catch (e) {
          reviewData.amenities = {};
        }
      }

      if (!reviewData.location_id || !reviewData.review_text) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: location_id, review_text'
        });
      }

      const result = await reviewService.createReview(reviewData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }


  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.user_id || req.body.user_id;

      const result = await reviewService.updateReview(id, updateData, userId);

      if (!result.success) {
        return res.status(result.message.includes('Unauthorized') ? 403 : 404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id || req.body.user_id;

      const result = await reviewService.deleteReview(id, userId);

      if (!result.success) {
        return res.status(result.message.includes('Unauthorized') ? 403 : 404).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addReviewImage(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { image_url } = req.body;
      const userId = req.user?.user_id || req.body.user_id;

      if (!image_url) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_FIELDS',
          message: 'Missing required field: image_url'
        });
      }

      const result = await reviewService.addReviewImage(reviewId, image_url, userId);

      if (!result.success) {
        return res.status(result.message.includes('Unauthorized') ? 403 : 404).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();

