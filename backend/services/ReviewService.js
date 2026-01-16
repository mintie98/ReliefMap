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
      // Check if location is confirmed accurate
      if (reviewData.is_location_accurate) {
        // Import location Repo
        const locationRepository = require('../repositories/LocationRepository');

        // Determine if targeting Verified or Pending location
        let targetId = reviewData.location_id;
        let isPending = false;

        if (typeof targetId === 'string' && targetId.startsWith('pending_')) {
          isPending = true;
          targetId = parseInt(targetId.replace('pending_', ''));
        }

        // Calculate Score Delta based on User Trust
        // Formula: Delta = User Trust Score (1-10)
        const scoreDelta = user.trust_score || 5;

        if (isPending) {
          // Update Pending Location Score
          await locationRepository.incrementPendingVerificationScore(targetId, scoreDelta);

          // Check for Promotion (Red -> Yellow -> Green)
          // Fetch current state
          const [pendingLoc] = await locationRepository.findAllPending(); // Optimize: findById needed but reusing findAll for now
          const targetLoc = pendingLoc ? pendingLoc /* verify filtering needed if findAll returns all */ : null;

          // TODO: Real implementation should add findVerificationById to Repo for efficiency
          // For now assuming we just incremented.
          // Promotion Logic:
          // If Score > 50 -> Approve to LOCATIONS_MERGED (Green)
          // If Score > 20 -> Upgrade status to 'pending' (Yellow) if was 'unverified'

          // NOTE: Since we lack findVerificationById in Repo interface shown previously, 
          // we will implement specific promotion check in a separate step or query.
          // For simplicity in this iteration: just increment.

        } else {
          // Update Verified Location Score
          await locationRepository.incrementVerificationScore(targetId, scoreDelta);

          // Check for Promotion (Red -> Yellow -> Green) for LOCATIONS_MERGED
          const loc = await locationRepository.findById(targetId);
          if (loc) {
            let newStatus = loc.verification_status;
            const score = loc.verification_score;

            // Thresholds
            if (score >= 5.0 && loc.verification_status === 'red') {
              newStatus = 'yellow';
            } else if (score >= 20.0 && loc.verification_status !== 'green') {
              newStatus = 'green';
            }

            if (newStatus !== loc.verification_status) {
              await locationRepository.update(targetId, { verification_status: newStatus });
              console.log(`Location ${targetId} promoted from ${loc.verification_status} to ${newStatus}`);
            }
          }
        }
      }

      if (reviewData.amenities) {
        // Import location Repo lazily
        const locationRepository = require('../repositories/LocationRepository');

        let targetId = reviewData.location_id;
        if (typeof targetId === 'string' && targetId.startsWith('pending_')) {
          // Pending location amenities are stored in JSON blob, cumbersome to update partially via Service without full read-write.
          // For now, we skip updating amenities on Pending locations via Review to avoid complexity, 
          // OR we accept that amenities are verified only upon promotion.
        } else {
          // Update Verified Location Amenities
          await locationRepository.updateAmenities(targetId, {
            ...reviewData.amenities,
            // gender_type could be inferred or passed explicitly
          });
        }
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

