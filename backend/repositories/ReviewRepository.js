const db = require('../config/database');

class ReviewRepository {
  async findByLocationId(locationId) {
    const query = `
      SELECT 
        r.*,
        u.user_name,
        u.trust_score as user_current_trust_score
      FROM REVIEWS r
      JOIN USERS u ON r.user_id = u.user_id
      WHERE r.location_id = ? AND r.is_deleted = FALSE
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(query, [locationId]);
    return rows;
  }

  async findById(reviewId) {
    const query = `
      SELECT 
        r.*,
        u.user_name
      FROM REVIEWS r
      JOIN USERS u ON r.user_id = u.user_id
      WHERE r.review_id = ? AND r.is_deleted = FALSE
    `;
    const [rows] = await db.execute(query, [reviewId]);
    return rows[0] || null;
  }

  async create(reviewData) {
    const query = `
      INSERT INTO REVIEWS (
        location_id, user_id, review_text, cleanliness_score,
        wait_time_score, user_trust_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.execute(query, [
      reviewData.location_id,
      reviewData.user_id,
      reviewData.review_text,
      reviewData.cleanliness_score,
      reviewData.wait_time_score,
      reviewData.user_trust_score
    ]);
    return result.insertId;
  }

  async update(reviewId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(reviewId);
    const query = `UPDATE REVIEWS SET ${fields.join(', ')} WHERE review_id = ?`;
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  async delete(reviewId) {
    const query = `UPDATE REVIEWS SET is_deleted = TRUE WHERE review_id = ?`;
    const [result] = await db.execute(query, [reviewId]);
    return result.affectedRows > 0;
  }

  async addImage(reviewId, imageUrl) {
    const query = `
      INSERT INTO REVIEW_IMAGES (review_id, image_url, uploaded_at)
      VALUES (?, ?, NOW())
    `;
    const [result] = await db.execute(query, [reviewId, imageUrl]);
    return result.insertId;
  }

  async getImages(reviewId) {
    const query = `
      SELECT * FROM REVIEW_IMAGES
      WHERE review_id = ? AND is_deleted = FALSE
      ORDER BY uploaded_at DESC
    `;
    const [rows] = await db.execute(query, [reviewId]);
    return rows;
  }
}

module.exports = new ReviewRepository();

