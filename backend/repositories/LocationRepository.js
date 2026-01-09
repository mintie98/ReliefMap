const db = require('../config/database');

class LocationRepository {
  // Get all merged locations (search by radius or bounding box)
  async findAll(filters = {}) {
    const { lat, lng, radius, swLat, swLng, neLat, neLng, verificationStatus, sourceType, limit = 50 } = filters;

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

    // Spatial Filter: Bounding Box (Priority)
    if (swLat && swLng && neLat && neLng) {
      // Create Polygon from BBox: SW -> SE -> NE -> NW -> SW
      // MySQL WKT: POLYGON((lng lat, ...)) i.e. (x y)
      // sw: bottom-left (swLng, swLat), ne: top-right (neLng, neLat)
      // Order: SW(minX minY) -> SE(maxX minY) -> NE(maxX maxY) -> NW(minX maxY) -> SW
      const polygon = `POLYGON((${swLng} ${swLat}, ${neLng} ${swLat}, ${neLng} ${neLat}, ${swLng} ${neLat}, ${swLng} ${swLat}))`;
      // Interpolate WKT directly to avoid prepared statement issues with spatial functions in some drivers/versions
      // Ensure coordinates are numbers to prevent injection (though they should be)
      query += ` AND MBRContains(ST_GeomFromText('${polygon}'), lm.geolocation)`;
      // params.push(polygon); // Removed from params
    }
    // Spatial Filter: Radius (Secondary)
    else if (lat && lng && radius) {
      // ST_Distance_Sphere(p1, p2). p2 = POINT(lng, lat)
      query += ` AND ST_Distance_Sphere(lm.geolocation, POINT(?, ?)) <= ?`;
      params.push(parseFloat(lng), parseFloat(lat), parseFloat(radius) * 1000);
    }

    if (verificationStatus) {
      query += ` AND lm.verification_status = ?`;
      params.push(verificationStatus);
    }

    if (sourceType) {
      query += ` AND lm.source_type = ?`;
      params.push(sourceType);
    }

    // Ordering
    if (lat && lng) {
      query += ` ORDER BY ST_Distance_Sphere(lm.geolocation, POINT(?, ?)) ASC`;
      params.push(parseFloat(lng), parseFloat(lat));
    } else {
      query += ` ORDER BY lm.verification_score DESC, lm.created_at DESC`;
    }

    // query += ` LIMIT ?`;
    // params.push(parseInt(limit));
    query += ` LIMIT ${parseInt(limit)}`;

    try {
      // console.log('DEBUG QUERY:', query);
      // console.log('DEBUG PARAMS:', params);
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (e) {
      console.error('FindAll Error:', e);
      throw e;
    }
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

  // Get location by Source ID (e.g. Google Place ID)
  async findBySourceId(sourceId) {
    const query = `SELECT * FROM LOCATIONS_BASE WHERE source_id = ?`;
    const [rows] = await db.execute(query, [sourceId]);
    if (rows.length === 0) return null;

    // Find associated MERGED record
    const mergedQuery = `SELECT * FROM LOCATIONS_MERGED WHERE base_id = ?`;
    const [mergedRows] = await db.execute(mergedQuery, [rows[0].base_id]);
    return mergedRows[0] || null;
  }

  // Create or Update location from base (Google API)
  async upsertFromBase(baseData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check if location already exists by source_id
      const [existing] = await connection.execute(
        'SELECT base_id FROM LOCATIONS_BASE WHERE source_id = ?',
        [baseData.source_id]
      );

      let baseId;
      let isNew = false;

      if (existing.length > 0) {
        // Update existing
        baseId = existing[0].base_id;
        const updateQuery = `
          UPDATE LOCATIONS_BASE SET
            name = ?, address = ?, latitude = ?, longitude = ?,
            place_types = ?, opening_hours = ?,
            google_rating = ?, google_ratings_total = ?,
            last_updated = NOW()
          WHERE base_id = ?
        `;
        await connection.execute(updateQuery, [
          baseData.name,
          baseData.address,
          baseData.latitude,
          baseData.longitude,
          JSON.stringify(baseData.place_types || []),
          JSON.stringify(baseData.opening_hours || {}),
          baseData.rating || null,
          baseData.user_ratings_total || null,
          baseId
        ]);
      } else {
        // Insert new
        isNew = true;
        const insertQuery = `
          INSERT INTO LOCATIONS_BASE (
            name, address, latitude, longitude, source_name, source_id,
            is_official, place_types, opening_hours,
            google_rating, google_ratings_total, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await connection.execute(insertQuery, [
          baseData.name,
          baseData.address,
          baseData.latitude,
          baseData.longitude,
          baseData.source_name,
          baseData.source_id,
          baseData.is_official || true,
          JSON.stringify(baseData.place_types || []),
          JSON.stringify(baseData.opening_hours || {}),
          baseData.rating || null,
          baseData.user_ratings_total || null
        ]);
        baseId = result.insertId;
      }

      // 2. Sync with LOCATIONS_MERGED
      if (isNew) {
        // Insert with Geolocation
        const mergedQuery = `
          INSERT INTO LOCATIONS_MERGED (
            base_id, display_name, address, latitude, longitude, geolocation,
            source_type, verification_status, verification_score,
            auto_verified, admin_verified, created_at
          ) VALUES (?, ?, ?, ?, ?, POINT(?, ?), 'api', 'green', 1.0, TRUE, FALSE, NOW())
        `;
        await connection.execute(mergedQuery, [
          baseId,
          baseData.name,
          baseData.address,
          baseData.latitude,
          baseData.longitude,
          baseData.longitude, baseData.latitude // For POINT(Lng, Lat)
        ]);
      } else {
        // Update with Geolocation
        await connection.execute(`
          UPDATE LOCATIONS_MERGED 
          SET display_name = ?, address = ?, latitude = ?, longitude = ?, geolocation = POINT(?, ?)
          WHERE base_id = ? AND source_type = 'api'
        `, [
          baseData.name, baseData.address, baseData.latitude, baseData.longitude,
          baseData.longitude, baseData.latitude,
          baseId
        ]);
      }

      await connection.commit();
      return baseId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Create location from UGC
  async createFromUGC(data) {
    const connection = await db.getConnection();
    try {
      const query = `
        INSERT INTO LOCATIONS_UGC (user_id, name, address_input, latitude, longitude, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await connection.execute(query, [
        data.user_id, data.name, data.address_input, data.latitude, data.longitude
      ]);

      const ugcId = result.insertId;

      const mergedQuery = `
        INSERT INTO LOCATIONS_MERGED (
           ugc_id, source_type, display_name, address, latitude, longitude,
           geolocation,
           verification_status, verification_score, creator_user_id,
           auto_verified, admin_verified, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, POINT(?, ?), ?, ?, ?, FALSE, FALSE, NOW())
      `;

      const [mergedResult] = await connection.execute(mergedQuery, [
        ugcId, 'user', data.name, data.address_input, data.latitude, data.longitude,
        data.longitude, data.latitude, // POINT(Lng, Lat)
        'red', 0.3, data.user_id
      ]);

      return mergedResult.insertId;
    } catch (error) {
      console.error('Error creating UGC location:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update location
  async update(locationId, updateData) {
    const fields = [];
    const values = [];

    // Separate checking for lat/lng to update geolocation
    let newLat = updateData.latitude;
    let newLng = updateData.longitude;
    // Note: If only one is updated, we need to fetch the other to update POINT correctly,
    // or just assume both are passed if one is passed. 
    // For simplicity, we assume generic update logic here but we can special case geolocation.

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (newLat !== undefined && newLng !== undefined) {
      fields.push(`geolocation = POINT(?, ?)`);
      values.push(newLng, newLat);
    }

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

  // Update or Create Amenities for a location
  async updateAmenities(locationId, amenities) {
    const connection = await db.getConnection();
    try {
      const query = `
        INSERT INTO AMENITIES (
          location_id, western_style, japanese_style, \`accessible\`, baby_changing, warm_seat, gender_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          western_style = VALUES(western_style),
          japanese_style = VALUES(japanese_style),
          \`accessible\` = VALUES(\`accessible\`),
          baby_changing = VALUES(baby_changing),
          warm_seat = VALUES(warm_seat),
          gender_type = VALUES(gender_type)
      `;

      const params = [
        locationId,
        amenities.western_style || false,
        amenities.japanese_style || false,
        amenities.accessible || false,
        amenities.baby_changing || false,
        amenities.warm_seat || false,
        amenities.gender_type || 'mixed'
      ];

      await connection.execute(query, params);
      return true;
    } catch (error) {
      console.error('Failed to update amenities:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Increment Verification Score
  async incrementVerificationScore(locationId, increment) {
    const query = `
      UPDATE LOCATIONS_MERGED 
      SET verification_score = verification_score + ? 
      WHERE location_id = ?
    `;
    const [result] = await db.execute(query, [increment, locationId]);
    return result.affectedRows > 0;
  }
}

module.exports = new LocationRepository();
