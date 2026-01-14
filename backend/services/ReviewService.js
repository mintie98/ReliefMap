const reviewRepository = require('../repositories/ReviewRepository');
const userRepository = require('../repositories/UserRepository');

class ReviewService {
  async getReviewsByLocation(locationId) {
    try {
      const reviews = await reviewRepository.findByLocationId(locationId);
      return {
        success: true,
        data: reviews,
        count: reviews.length
      };
    } catch (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }
  }

  async createReview(reviewData) {
    try {
      // Get user trust score at time of review
      const user = await userRepository.findById(reviewData.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      reviewData.user_trust_score = user.trust_score;

      const reviewId = await reviewRepository.create(reviewData);

      // Save Images
      if (reviewData.files && reviewData.files.length > 0) {
        const imagePromises = reviewData.files.map(file => {
          // Construct URL relative to server
          const imageUrl = `/uploads/${file.filename}`;
          return reviewRepository.addImage(reviewId, imageUrl);
        });
        await Promise.all(imagePromises);
      }

      // Update Amenities & Verification Logic
      if (reviewData.amenities) {
        // Import location Repo lazily or at top to avoid circular if any
        const locationRepository = require('../repositories/LocationRepository');

        // Update amenities
        await locationRepository.updateAmenities(reviewData.location_id, {
          ...reviewData.amenities,
          // gender_type could be inferred or passed explicitly
        });

        // Increment verification score for the location
        // Basic logic: Each review adds small trust
        await locationRepository.incrementVerificationScore(reviewData.location_id, 0.2);

        // Update verified status if score is high enough (e.g. > 5.0)
        // This logic could be inside Repository or Service. For now, we trust score.
      }

      // Increment user contribution
      await userRepository.incrementContribution(reviewData.user_id);

      return {
        success: true,
        data: { review_id: reviewId },
        message: 'Review created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  async updateReview(reviewId, updateData, userId) {
    try {
      // Verify ownership
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        return {
          success: false,
          message: 'Review not found'
        };
      }

      if (review.user_id !== userId) {
        return {
          success: false,
          message: 'Unauthorized to update this review'
        };
      }

      const updated = await reviewRepository.update(reviewId, updateData);
      if (!updated) {
        return {
          success: false,
          message: 'Failed to update review'
        };
      }

      return {
        success: true,
        message: 'Review updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  async deleteReview(reviewId, userId) {
    try {
      // Verify ownership
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        return {
          success: false,
          message: 'Review not found'
        };
      }

      if (review.user_id !== userId) {
        return {
          success: false,
          message: 'Unauthorized to delete this review'
        };
      }

      const deleted = await reviewRepository.delete(reviewId);
      if (!deleted) {
        return {
          success: false,
          message: 'Failed to delete review'
        };
      }

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async addReviewImage(reviewId, imageUrl, userId) {
    try {
      // Verify ownership
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        return {
          success: false,
          message: 'Review not found'
        };
      }

      if (review.user_id !== userId) {
        return {
          success: false,
          message: 'Unauthorized to add image to this review'
        };
      }

      const imageId = await reviewRepository.addImage(reviewId, imageUrl);
      return {
        success: true,
        data: { image_id: imageId },
        message: 'Image added successfully'
      };
    } catch (error) {
      throw new Error(`Failed to add image: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();

