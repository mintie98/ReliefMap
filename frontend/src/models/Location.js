/**
 * Location Model
 * Represents a WC location in the system
 */
export class Location {
  constructor(data = {}) {
    this.location_id = data.location_id || null;
    this.base_id = data.base_id || null;
    this.ugc_id = data.ugc_id || null;
    this.display_name = data.display_name || '';
    this.address = data.address || '';
    this.latitude = data.latitude || 0;
    this.longitude = data.longitude || 0;
    this.source_type = data.source_type || 'user'; // 'api', 'admin', 'user'
    this.verification_status = data.verification_status || 'red'; // 'red', 'yellow', 'green'
    this.verification_score = data.verification_score || 0;
    this.auto_verified = data.auto_verified || false;
    this.admin_verified = data.admin_verified || false;
    this.creator_user_id = data.creator_user_id || null;
    this.creator_trust_score = data.creator_trust_score || null;
    this.created_at = data.created_at || null;
    
    // Amenities
    this.western_style = data.western_style || false;
    this.japanese_style = data.japanese_style || false;
    this.accessible = data.accessible || false;
    this.baby_changing = data.baby_changing || false;
    this.warm_seat = data.warm_seat || false;
    this.gender_type = data.gender_type || 'mixed';
  }

  /**
   * Get verification status color
   */
  getStatusColor() {
    const colors = {
      'red': '#e74c3c',
      'yellow': '#f39c12',
      'green': '#27ae60'
    };
    return colors[this.verification_status] || '#95a5a6';
  }

  /**
   * Check if location is verified
   */
  isVerified() {
    return this.verification_status === 'green' || this.admin_verified;
  }

  /**
   * Get distance from a point (in km)
   */
  getDistanceFrom(lat, lng) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(this.latitude - lat);
    const dLng = this.toRad(this.longitude - lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat)) * Math.cos(this.toRad(this.latitude)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

