import apiClient from './api';
import { Review } from '../models/Review';

class ReviewService {
  /**
   * Get reviews by location ID
   */
  async getReviewsByLocation(locationId) {
    try {
      const response = await apiClient.get(`/reviews/location/${locationId}`);
      return {
        success: response.success,
        data: response.data.map(review => new Review(review)),
        count: response.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Create a review
   */
  async createReview(reviewData) {
    try {
      const response = await apiClient.post('/reviews', reviewData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update a review
   */
  async updateReview(reviewId, updateData) {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}`, updateData);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    try {
      const response = await apiClient.delete(`/reviews/${reviewId}`);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add image to review
   */
  async addReviewImage(reviewId, imageUrl) {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/images`, { image_url: imageUrl });
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ReviewService();

