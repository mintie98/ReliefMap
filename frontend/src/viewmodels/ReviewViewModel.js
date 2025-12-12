import { ref, computed } from 'vue';
import reviewService from '../services/ReviewService';
import { Review } from '../models/Review';

/**
 * ReviewViewModel
 * Manages state and business logic for reviews
 */
export function useReviewViewModel() {
  // State
  const reviews = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const averageCleanliness = computed(() => {
    if (reviews.value.length === 0) return 0;
    const sum = reviews.value.reduce((acc, review) => acc + review.cleanliness_score, 0);
    return (sum / reviews.value.length).toFixed(1);
  });

  const averageWaitTime = computed(() => {
    if (reviews.value.length === 0) return 0;
    const sum = reviews.value.reduce((acc, review) => acc + review.wait_time_score, 0);
    return (sum / reviews.value.length).toFixed(1);
  });

  const averageScore = computed(() => {
    if (reviews.value.length === 0) return 0;
    const sum = reviews.value.reduce((acc, review) => acc + review.getAverageScore(), 0);
    return (sum / reviews.value.length).toFixed(1);
  });

  // Methods
  const loadReviews = async (locationId) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await reviewService.getReviewsByLocation(locationId);
      
      if (result.success) {
        reviews.value = result.data;
      } else {
        error.value = result.error || 'Failed to load reviews';
        reviews.value = [];
      }
    } catch (err) {
      error.value = err.message;
      reviews.value = [];
    } finally {
      loading.value = false;
    }
  };

  const createReview = async (reviewData) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await reviewService.createReview(reviewData);
      
      if (result.success) {
        // Reload reviews
        await loadReviews(reviewData.location_id);
        return result;
      } else {
        error.value = result.error || 'Failed to create review';
        return result;
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateReview = async (reviewId, updateData) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await reviewService.updateReview(reviewId, updateData);
      
      if (result.success) {
        // Reload reviews
        const locationId = reviews.value.find(r => r.review_id === reviewId)?.location_id;
        if (locationId) {
          await loadReviews(locationId);
        }
        return result;
      } else {
        error.value = result.error || 'Failed to update review';
        return result;
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const deleteReview = async (reviewId) => {
    loading.value = true;
    error.value = null;

    try {
      const locationId = reviews.value.find(r => r.review_id === reviewId)?.location_id;
      const result = await reviewService.deleteReview(reviewId);
      
      if (result.success) {
        // Reload reviews
        if (locationId) {
          await loadReviews(locationId);
        }
        return result;
      } else {
        error.value = result.error || 'Failed to delete review';
        return result;
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    reviews,
    loading,
    error,
    
    // Computed
    averageCleanliness,
    averageWaitTime,
    averageScore,
    
    // Methods
    loadReviews,
    createReview,
    updateReview,
    deleteReview,
    clearError
  };
}

