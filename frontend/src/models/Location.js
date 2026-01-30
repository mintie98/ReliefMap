/**
 * Location Model
 * Represents a WC location in the system
 */
export class Location {
  constructor(data = {}) {
    this.location_id = data.location_id || null;
    this.base_id = data.base_id || null;
    this.ugc_id = data.ugc_id || null;
    this.display_name = data.display_name || data.name || '';
    this.address = data.address || data.formatted_address || data.vicinity || data.address_input || '';
    this.latitude = parseFloat(data.latitude) || 0;
    this.longitude = parseFloat(data.longitude) || 0;
    this.source_type = data.source_type || 'user'; // 'api', 'admin', 'user'
    this.verification_status = data.verification_status || 'red'; // 'red', 'yellow', 'green'
    this.verification_score = data.verification_score || 0;
    this.auto_verified = data.auto_verified || false;
    this.admin_verified = data.admin_verified || false;
    this.creator_user_id = data.creator_user_id || null;
    this.creator_trust_score = data.creator_trust_score || null;
    this.created_at = data.created_at || null;

    // Google/Base Data
    this.google_rating = data.google_rating;
    this.google_ratings_total = data.google_ratings_total;
    this.opening_hours = data.opening_hours;
    this.photo_reference = data.photo_reference;
    this.images = data.images || [];
    this.notes = data.notes || '';
    this.closed_days = data.closed_days || '';
    this.user_opening_hours = data.user_opening_hours;
    this.reviews = data.reviews || [];

    // Helper to get amenity value (flat or nested)
    const getAm = (key) => Boolean(data[key] || (data.amenities && data.amenities[key]));

    // Flat Amenities (Legacy access + Nested support)
    this.western_style = getAm('western_style');
    this.japanese_style = getAm('japanese_style');
    this.accessible = getAm('accessible');
    this.baby_changing = getAm('baby_changing');
    this.warm_seat = getAm('warm_seat');
    this.gender_type = data.gender_type || (data.amenities && data.amenities.gender_type) || 'mixed';

    // Extended Amenities (Flat + Nested)
    this.public_toilet = getAm('public_toilet');
    this.gender_separated = getAm('gender_separated');
    this.powder_room = getAm('powder_room');
    this.barrier_free = getAm('barrier_free');
    this.ostomate = getAm('ostomate');
    this.large_bed = getAm('large_bed');
    this.parking = getAm('parking');
    this.store_usage = getAm('store_usage');
    this.diaper_changing = getAm('diaper_changing');
    this.child_seat = getAm('child_seat');

    // Amenities Object (For component compatibility)
    this.amenities = {
      western_style: this.western_style,
      japanese_style: this.japanese_style,
      accessible: this.accessible,
      baby_changing: this.baby_changing, // legacy key
      warm_seat: this.warm_seat,
      gender_type: this.gender_type,

      public_toilet: this.public_toilet,
      gender_separated: this.gender_separated,
      powder_room: this.powder_room,
      barrier_free: this.barrier_free,
      ostomate: this.ostomate,
      large_bed: this.large_bed,
      parking: this.parking,
      store_usage: this.store_usage,
      diaper_changing: this.diaper_changing,
      child_seat: this.child_seat
    };
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

