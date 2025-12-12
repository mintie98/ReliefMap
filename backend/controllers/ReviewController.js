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
      const reviewData = {
        ...req.body,
        user_id: req.user?.user_id || req.body.user_id
      };

      if (!reviewData.location_id || !reviewData.review_text) {
        return res.status(400).json({
          success: false,
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

