const db = require('../config/database');

class UserRepository {
  async findById(userId) {
    const query = 'SELECT * FROM USERS WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM USERS WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  }

  async create(userData) {
    const query = `
      INSERT INTO USERS (
        user_name, email, password_hash, preferred_language,
        trust_score, user_role, auth_provider, provider_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.execute(query, [
      userData.user_name,
      userData.email,
      userData.password_hash,
      userData.preferred_language || 'en',
      userData.trust_score || 5,
      userData.user_role || 'general',
      userData.auth_provider,
      userData.provider_id
    ]);
    return result.insertId;
  }

  async update(userId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(userId);
    const query = `UPDATE USERS SET ${fields.join(', ')} WHERE user_id = ?`;
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  async incrementContribution(userId) {
    const query = `
      UPDATE USERS 
      SET contribution_count = contribution_count + 1 
      WHERE user_id = ?
    `;
    await db.execute(query, [userId]);
  }

  async incrementVerifiedContribution(userId) {
    const query = `
      UPDATE USERS 
      SET verified_contributions = verified_contributions + 1 
      WHERE user_id = ?
    `;
    await db.execute(query, [userId]);
  }
}

module.exports = new UserRepository();

