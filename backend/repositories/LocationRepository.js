const db = require('../config/database');
const reviewRepository = require('./ReviewRepository');

class LocationRepository {
  // Get all merged locations (search by radius or bounding box)
  async findAll(filters = {}) {
    const { lat, lng, radius, swLat, swLng, neLat, neLng, verificationStatus, sourceType, searchTerm, amenities, limit = 50 } = filters;

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
        lm.created_at,
        lm.opening_hours as user_opening_hours,
        lm.closed_days,
        lm.notes,
        CASE 
          WHEN lm.images IS NULL OR lm.images = '[]' OR lm.images = '' THEN lu.images 
          ELSE lm.images 
        END as images,
        lb.google_rating,
        lb.google_ratings_total,
        lb.opening_hours as google_opening_hours,
        lb.photo_reference,
        a.western_style,
        a.japanese_style,
        a.accessible,
        a.child_seat,
        a.diaper_changing,
        a.warm_seat,
        a.gender_type,
        a.public_toilet,
        a.gender_separated,
        a.powder_room,
        a.barrier_free,
        a.ostomate,
        a.large_bed,
        a.parking,
        a.parking,
        a.store_usage,
        lm.floors
      FROM LOCATIONS_MERGED lm
      LEFT JOIN LOCATIONS_UGC lu ON lm.ugc_id = lu.ugc_id
      LEFT JOIN LOCATIONS_BASE lb ON lm.base_id = lb.base_id
      LEFT JOIN AMENITIES a ON lm.location_id = a.location_id
      WHERE lm.is_deleted = FALSE
    `;
    const params = [];

    // Search Term (Name or Address)
    if (searchTerm) {
      query += ` AND (lm.display_name LIKE ? OR lm.address LIKE ?)`;
      const term = `%${searchTerm}%`;
      params.push(term, term);
    }

    // Verification Status (Array or Single)
    if (verificationStatus) {
      if (Array.isArray(verificationStatus) && verificationStatus.length > 0) {
        // e.g. status IN (?, ?)
        const placeholders = verificationStatus.map(() => '?').join(',');
        query += ` AND lm.verification_status IN (${placeholders})`;
        params.push(...verificationStatus);
      } else if (!Array.isArray(verificationStatus)) {
        query += ` AND lm.verification_status = ?`;
        params.push(verificationStatus);
      }
    }

    // Source Type
    if (sourceType) {
      query += ` AND lm.source_type = ?`;
      params.push(sourceType);
    }

    // Amenities (filters.amenities = { western: true, ... })
    if (amenities) {
      if (amenities.western) query += ` AND a.western_style = TRUE`;
      if (amenities.japanese) query += ` AND a.japanese_style = TRUE`;
      if (amenities.wheelchair) query += ` AND a.accessible = TRUE`;
      if (amenities.child_seat) query += ` AND a.child_seat = TRUE`; // Changed from baby_changing
      if (amenities.diaper) query += ` AND a.diaper_changing = TRUE`; // Added
      if (amenities.washlet) query += ` AND a.warm_seat = TRUE`;
      // New filters
      if (amenities.public_toilet) query += ` AND a.public_toilet = TRUE`;
      if (amenities.gender_separated) query += ` AND a.gender_separated = TRUE`;
      if (amenities.powder_room) query += ` AND a.powder_room = TRUE`;
      if (amenities.barrier_free) query += ` AND a.barrier_free = TRUE`;
      if (amenities.ostomate) query += ` AND a.ostomate = TRUE`;
      if (amenities.large_bed) query += ` AND a.large_bed = TRUE`;
      if (amenities.parking) query += ` AND a.parking = TRUE`;
      if (amenities.store_usage) query += ` AND a.store_usage = TRUE`;
    }

    // Spatial Filter: Bounding Box (Priority)
    if (swLat && swLng && neLat && neLng) {
      const polygon = `POLYGON((${swLng} ${swLat}, ${neLng} ${swLat}, ${neLng} ${neLat}, ${swLng} ${neLat}, ${swLng} ${swLat}))`;
      query += ` AND MBRContains(ST_GeomFromText('${polygon}'), lm.geolocation)`;
    }
    // Spatial Filter: Radius (Secondary)
    else if (lat && lng && radius) {
      query += ` AND ST_Distance_Sphere(lm.geolocation, POINT(?, ?)) <= ?`;
      params.push(parseFloat(lng), parseFloat(lat), parseFloat(radius) * 1000);
    }

    // Ordering
    if (lat && lng) {
      query += ` ORDER BY ST_Distance_Sphere(lm.geolocation, POINT(?, ?)) ASC`;
      params.push(parseFloat(lng), parseFloat(lat));
    } else {
      query += ` ORDER BY lm.verification_score DESC, lm.created_at DESC`;
    }

    query += ` LIMIT ${parseInt(limit)}`;

    try {
      const [rows] = await db.execute(query, params);

      // Parse JSON columns (images might be returned as Buffer or string)
      const parsedRows = rows.map(row => {
        // Parse images if it's a string or Buffer
        if (row.images) {
          if (typeof row.images === 'string') {
            try {
              row.images = JSON.parse(row.images);
            } catch (e) {
              console.log('Failed to parse images:', e);
            }
          } else if (Buffer.isBuffer(row.images)) {
            try {
              row.images = JSON.parse(row.images.toString());
            } catch (e) {
              console.log('Failed to parse images from Buffer:', e);
            }
          }
        }
        if (row.floors && typeof row.floors === 'string') {
          try { row.floors = JSON.parse(row.floors); } catch (e) { }
        }
        return row;
      });

      return parsedRows;
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
        lm.opening_hours as user_opening_hours,
        lm.closed_days,
        lm.notes,
        CASE 
          WHEN lm.images IS NULL OR lm.images = '[]' OR lm.images = '' THEN lu.images 
          ELSE lm.images 
        END as images,
        a.western_style,
        a.japanese_style,
        a.accessible,
        a.child_seat,
        a.diaper_changing,
        a.warm_seat,
        a.gender_type,
        a.public_toilet,
        a.gender_separated,
        a.powder_room,
        a.barrier_free,
        a.ostomate,
        a.large_bed,
        a.parking,
        a.store_usage,
        a.parking,
        a.store_usage,
        lm.floors,
        lb.google_rating,
        lb.google_ratings_total,
        lb.opening_hours as google_opening_hours,
        lb.photo_reference
      FROM LOCATIONS_MERGED lm
      LEFT JOIN LOCATIONS_UGC lu ON lm.ugc_id = lu.ugc_id
      LEFT JOIN AMENITIES a ON lm.location_id = a.location_id
      LEFT JOIN LOCATIONS_BASE lb ON lm.base_id = lb.base_id
      WHERE lm.location_id = ? AND lm.is_deleted = FALSE
    `;
    const [rows] = await db.execute(query, [locationId]);

    if (!rows[0]) return null;

    const location = rows[0];

    // Parse images (JSON column might be string or Buffer)
    if (location.images) {
      if (typeof location.images === 'string') {
        try {
          location.images = JSON.parse(location.images);
        } catch (e) {
          console.error('Failed to parse location.images:', e);
          location.images = [];
        }
      } else if (Buffer.isBuffer(location.images)) {
        try {
          location.images = JSON.parse(location.images.toString());
        } catch (e) {
          console.error('Failed to parse location.images Buffer:', e);
          location.images = [];
        }
      }
    }

    // Fetch reviews với images từ ReviewRepository (đã JOIN REVIEW_IMAGES)
    const reviews = await reviewRepository.findByLocationId(locationId);

    // Attach reviews to location
    // Parse floors
    if (location.floors && typeof location.floors === 'string') {
      try { location.floors = JSON.parse(location.floors); } catch (e) { }
    }

    location.reviews = reviews;

    return location;
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

      // Debug log
      if (baseData.photo_reference) {
        // console.log(`Upserting location with photo_ref: ${baseData.photo_reference.substring(0, 15)}...`);
      }

      if (existing.length > 0) {
        // Update existing
        baseId = existing[0].base_id;
        const updateQuery = `
          UPDATE LOCATIONS_BASE SET
            name = ?, address = ?, latitude = ?, longitude = ?,
            place_types = ?, opening_hours = ?, photo_reference = ?,
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
          baseData.photo_reference || null,
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
            is_official, place_types, opening_hours, photo_reference,
            google_rating, google_ratings_total, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
          baseData.photo_reference || null,
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
      // console.log(`Upsert successful for source_id: ${baseData.source_id}, base_id: ${baseId}`);
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
        INSERT INTO LOCATIONS_UGC (
          user_id, name, address_input, latitude, longitude, 
          opening_hours, closed_days, notes, images, floors, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await connection.execute(query, [
        data.user_id,
        data.name,
        data.address_input,
        data.latitude,
        data.longitude,
        data.opening_hours || null,
        data.closed_days || null,
        data.notes || null,
        data.images ? JSON.stringify(data.images) : null,
        data.floors ? JSON.stringify(data.floors) : null
      ]);

      const ugcId = result.insertId;

      const mergedQuery = `
        INSERT INTO LOCATIONS_MERGED (
           ugc_id, source_type, display_name, address, latitude, longitude,
           geolocation,
           opening_hours, closed_days, notes, images, floors,
           verification_status, verification_score, creator_user_id,
           auto_verified, admin_verified, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, POINT(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, NOW())
      `;

      const [mergedResult] = await connection.execute(mergedQuery, [
        ugcId, 'user', data.name, data.address_input, data.latitude, data.longitude,
        data.longitude, data.latitude, // POINT(Lng, Lat)
        data.opening_hours || null,
        data.closed_days || null,
        data.notes || null,
        data.images ? JSON.stringify(data.images) : null,
        data.floors ? JSON.stringify(data.floors) : null,
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
    return this.findAll({ searchTerm, limit: 50 });
  }

  // Update or Create Amenities for a location
  async updateAmenities(locationId, amenities) {
    const connection = await db.getConnection();
    try {
      const query = `
        INSERT INTO AMENITIES (
          location_id, western_style, japanese_style, \`accessible\`, child_seat, diaper_changing, warm_seat, gender_type,
          public_toilet, gender_separated, powder_room, barrier_free, ostomate, large_bed, parking, store_usage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          western_style = VALUES(western_style),
          japanese_style = VALUES(japanese_style),
          \`accessible\` = VALUES(\`accessible\`),
          child_seat = VALUES(child_seat),
          diaper_changing = VALUES(diaper_changing),
          warm_seat = VALUES(warm_seat),
          gender_type = VALUES(gender_type),
          public_toilet = VALUES(public_toilet),
          gender_separated = VALUES(gender_separated),
          powder_room = VALUES(powder_room),
          barrier_free = VALUES(barrier_free),
          ostomate = VALUES(ostomate),
          large_bed = VALUES(large_bed),
          parking = VALUES(parking),
          store_usage = VALUES(store_usage)
      `;

      const params = [
        locationId,
        amenities.western_style || false,
        amenities.japanese_style || false,
        amenities.accessible || false,
        amenities.child_seat || false, // Renamed from baby_changing
        amenities.diaper_changing || false, // Added
        amenities.warm_seat || false,
        amenities.gender_type || 'mixed',
        // New columns
        amenities.public_toilet || false,
        amenities.gender_separated || false,
        amenities.powder_room || false,
        amenities.barrier_free || false,
        amenities.ostomate || false,
        amenities.large_bed || false,
        amenities.parking || false,
        amenities.store_usage || false
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

  // --- WC Verifications (Pending Locations) ---

  // Create pending verification
  async createVerification(data) {
    const connection = await db.getConnection();
    try {
      const query = `
        INSERT INTO wc_verifications (user_id, location_data, status, verification_score, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      // location_data stores the full UGC payload
      const [result] = await connection.execute(query, [
        data.user_id,
        JSON.stringify(data.location_data),
        data.status || 'unverified',
        data.verification_score || 0
      ]);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Find pending verifications (for Map or Admin)
  async findAllPending(filters = {}) {
    // Basic select, filtering by status unverified/pending
    let query = `SELECT * FROM wc_verifications WHERE status IN ('unverified', 'pending')`;
    const params = [];

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Increment score for pending verification
  async incrementPendingVerificationScore(verificationId, increment) {
    const query = `
      UPDATE wc_verifications 
      SET verification_score = verification_score + ? 
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [increment, verificationId]);
    return result.affectedRows > 0;
  }

  // Add image to pending verification
  async addImageToPending(verificationId, imageUrls) {
    // 1. Fetch current data
    const query = `SELECT location_data FROM wc_verifications WHERE id = ?`;
    const [rows] = await db.execute(query, [verificationId]);
    if (rows.length === 0) return false;

    // 2. Parse and update
    let locationData = {};
    try {
      locationData = JSON.parse(rows[0].location_data);
    } catch (e) {
      console.error('Failed to parse pending location data:', e);
    }

    if (!locationData.images) locationData.images = [];
    // locations_ugc stores images as array of strings
    locationData.images.push(...imageUrls);

    // 3. Save back
    const updateQuery = `UPDATE wc_verifications SET location_data = ? WHERE id = ?`;
    const [result] = await db.execute(updateQuery, [JSON.stringify(locationData), verificationId]);
    return result.affectedRows > 0;
  }
}

module.exports = new LocationRepository();
