const db = require('../config/database');

class AmenityRepository {
  async findByLocationId(locationId) {
    const query = 'SELECT * FROM AMENITIES WHERE location_id = ?';
    const [rows] = await db.execute(query, [locationId]);
    return rows[0] || null;
  }

  async create(locationId, amenityData) {
    const query = `
      INSERT INTO AMENITIES (
        location_id, western_style, japanese_style, accessible,
        baby_changing, warm_seat, gender_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      locationId,
      amenityData.western_style || false,
      amenityData.japanese_style || false,
      amenityData.accessible || false,
      amenityData.baby_changing || false,
      amenityData.warm_seat || false,
      amenityData.gender_type || 'mixed'
    ]);
    return result.insertId;
  }

  async update(locationId, amenityData) {
    const query = `
      UPDATE AMENITIES SET
        western_style = ?,
        japanese_style = ?,
        accessible = ?,
        baby_changing = ?,
        warm_seat = ?,
        gender_type = ?
      WHERE location_id = ?
    `;
    const [result] = await db.execute(query, [
      amenityData.western_style,
      amenityData.japanese_style,
      amenityData.accessible,
      amenityData.baby_changing,
      amenityData.warm_seat,
      amenityData.gender_type,
      locationId
    ]);
    return result.affectedRows > 0;
  }

  async delete(locationId) {
    const query = 'DELETE FROM AMENITIES WHERE location_id = ?';
    const [result] = await db.execute(query, [locationId]);
    return result.affectedRows > 0;
  }
}

module.exports = new AmenityRepository();

