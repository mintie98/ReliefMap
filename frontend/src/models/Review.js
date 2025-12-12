/**
 * Review Model
 * Represents a review for a WC location
 */
export class Review {
  constructor(data = {}) {
    this.review_id = data.review_id || null;
    this.location_id = data.location_id || null;
    this.user_id = data.user_id || null;
    this.user_name = data.user_name || 'Anonymous';
    this.review_text = data.review_text || '';
    this.cleanliness_score = data.cleanliness_score || 0;
    this.wait_time_score = data.wait_time_score || 0;
    this.user_trust_score = data.user_trust_score || 0;
    this.user_current_trust_score = data.user_current_trust_score || 0;
    this.created_at = data.created_at || null;
    this.images = data.images || [];
  }

  /**
   * Get average score
   */
  getAverageScore() {
    return (this.cleanliness_score + this.wait_time_score) / 2;
  }

  /**
   * Get formatted date
   */
  getFormattedDate() {
    if (!this.created_at) return '';
    const date = new Date(this.created_at);
    return date.toLocaleDateString();
  }
}

