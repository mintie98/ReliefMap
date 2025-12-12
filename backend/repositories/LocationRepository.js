const db = require('../config/database');

class LocationRepository {
  // Get all merged locations (for map display)
  async findAll(filters = {}) {
    const { lat, lng, radius, verificationStatus, sourceType } = filters;
    let query = `
      SELECT 
        lm.location_id,
        lm.base_id,
        lm.ugc_id,
        lm.display_name,
        lm.address,
        lm.latitude,
        lm.longitude,
        lm.source_type,
        lm.verification_status,
        lm.verification_score,
        lm.auto_verified,
        lm.admin_verified,
        lm.creator_user_id,
        lm.creator_trust_score,
        lm.created_at
      FROM LOCATIONS_MERGED lm
      WHERE lm.is_deleted = FALSE
    `;
    const params = [];

    if (verificationStatus) {
      query += ` AND lm.verification_status = ?`;
      params.push(verificationStatus);
    }

    if (sourceType) {
      query += ` AND lm.source_type = ?`;
      params.push(sourceType);
    }

    // Distance filter (Haversine formula approximation)
    if (lat && lng && radius) {
      query += `
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(lm.latitude)) *
            cos(radians(lm.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(lm.latitude))
          )
        ) <= ?
      `;
      params.push(lat, lng, lat, radius);
    }

    query += ` ORDER BY lm.verification_score DESC, lm.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get location by ID
  async findById(locationId) {
    const query = `
      SELECT 
        lm.*,
        a.western_style,
        a.japanese_style,
        a.accessible,
        a.baby_changing,
        a.warm_seat,
        a.gender_type
      FROM LOCATIONS_MERGED lm
      LEFT JOIN AMENITIES a ON lm.location_id = a.location_id
      WHERE lm.location_id = ? AND lm.is_deleted = FALSE
    `;
    const [rows] = await db.execute(query, [locationId]);
    return rows[0] || null;
  }

  // Create location from base (API)
  async createFromBase(baseData) {
    const query = `
      INSERT INTO LOCATIONS_BASE (
        name, address, latitude, longitude, source_name, source_id, is_official, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.execute(query, [
      baseData.name,
      baseData.address,
      baseData.latitude,
      baseData.longitude,
      baseData.source_name,
      baseData.source_id,
      baseData.is_official || true
    ]);

    // Create merged location
    const mergedQuery = `
      INSERT INTO LOCATIONS_MERGED (
        base_id, display_name, address, latitude, longitude,
        source_type, verification_status, verification_score,
        auto_verified, admin_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, 'api', 'yellow', 0.5, TRUE, FALSE, NOW())
    `;
    const [mergedResult] = await db.execute(mergedQuery, [
      result.insertId,
      baseData.name,
      baseData.address,
      baseData.latitude,
      baseData.longitude
    ]);

    return mergedResult.insertId;
  }

  // Create location from UGC
  async createFromUGC(ugcData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert UGC location
      const ugcQuery = `
        INSERT INTO LOCATIONS_UGC (
          user_id, name, address_input, latitude, longitude, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const [ugcResult] = await connection.execute(ugcQuery, [
        ugcData.user_id,
        ugcData.name,
        ugcData.address_input,
        ugcData.latitude,
        ugcData.longitude
      ]);

      // Get user trust score
      const [userRows] = await connection.execute(
        'SELECT trust_score FROM USERS WHERE user_id = ?',
        [ugcData.user_id]
      );
      const trustScore = userRows[0]?.trust_score || 5;

      // Create merged location
      const mergedQuery = `
        INSERT INTO LOCATIONS_MERGED (
          ugc_id, display_name, address, latitude, longitude,
          source_type, verification_status, verification_score,
          auto_verified, admin_verified, creator_user_id, creator_trust_score, created_at
        ) VALUES (?, ?, ?, ?, ?, 'user', 'red', 0.3, FALSE, FALSE, ?, ?, NOW())
      `;
      const [mergedResult] = await connection.execute(mergedQuery, [
        ugcResult.insertId,
        ugcData.name,
        ugcData.address_input,
        ugcData.latitude,
        ugcData.longitude,
        ugcData.user_id,
        trustScore
      ]);

      await connection.commit();
      return mergedResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update location
  async update(locationId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(locationId);
    const query = `UPDATE LOCATIONS_MERGED SET ${fields.join(', ')} WHERE location_id = ?`;
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  // Soft delete location
  async delete(locationId) {
    const query = `UPDATE LOCATIONS_MERGED SET is_deleted = TRUE WHERE location_id = ?`;
    const [result] = await db.execute(query, [locationId]);
    return result.affectedRows > 0;
  }

  // Search locations by name or address
  async search(searchTerm) {
    const query = `
      SELECT * FROM LOCATIONS_MERGED
      WHERE is_deleted = FALSE
        AND (display_name LIKE ? OR address LIKE ?)
      ORDER BY verification_score DESC
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await db.execute(query, [searchPattern, searchPattern]);
    return rows;
  }
}

module.exports = new LocationRepository();

