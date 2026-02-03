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

      // Check if this is a Pending Location (e.g. "pending_123")
      let targetId = reviewData.location_id;
      let isPending = false;

      if (typeof targetId === 'string' && targetId.startsWith('pending_')) {
        isPending = true;
        targetId = parseInt(targetId.replace('pending_', ''));
      }

      // --- LOGIC FOR PENDING LOCATIONS ---
      if (isPending) {
        const locationRepository = require('../repositories/LocationRepository');

        // 1. Increment Verification Score
        // Formula: Delta = User Trust Score (1-10)
        const scoreDelta = user.trust_score || 5;
        await locationRepository.incrementPendingVerificationScore(targetId, scoreDelta);

        // 2. Add Images (if any) to the Pending Location record directly
        if (reviewData.files && reviewData.files.length > 0) {
          const imageUrls = reviewData.files.map(file => `/uploads/${file.filename}`);
          await locationRepository.addImageToPending(targetId, imageUrls);
        }

        // 3. Log contribution
        await userRepository.incrementContribution(reviewData.user_id);

        // Return success immediately (No Review created in REVIEWS table)
        return {
          success: true,
          data: { location_id: `pending_${targetId}`, is_pending: true },
          message: 'Verification submitted! Your contribution helps validatethis location.'
        };
      }

      // --- LOGIC FOR VERIFIED LOCATIONS (Standard Review) ---

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
      // Link Repository Lazily to avoid circular dependency
      const locationRepository = require('../repositories/LocationRepository');

      // Update Floors (Merge Logic)
      if (reviewData.floors && Array.isArray(reviewData.floors) && reviewData.floors.length > 0) {
        try {
          const currentLoc = await locationRepository.findById(targetId);
          if (currentLoc) {
            let existingFloors = currentLoc.floors || [];
            // Parse if string
            if (typeof existingFloors === 'string') {
              try { existingFloors = JSON.parse(existingFloors); } catch (e) { existingFloors = []; }
            }

            // Merge: Union of existing + new
            const mergedFloors = [...new Set([...existingFloors, ...reviewData.floors])].sort();

            await locationRepository.update(targetId, {
              floors: JSON.stringify(mergedFloors)
            });
          }
        } catch (err) {
          console.error('Error updating floors from review:', err);
        }
      }

      // Check if location is confirmed accurate
      if (reviewData.is_location_accurate) {

        // Standard Location: Update Verified Location Score
        const scoreDelta = user.trust_score || 5;
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

      if (reviewData.amenities) {
        // Import location Repo lazily
        const locationRepository = require('../repositories/LocationRepository');

        // Update Verified Location Amenities
        await locationRepository.updateAmenities(targetId, {
          ...reviewData.amenities,
          // gender_type could be inferred or passed explicitly
        });
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

