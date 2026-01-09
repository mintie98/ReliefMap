const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

class AuthService {
    // Register User
    async register(userData) {
        const { name, email, password, preferred_language = 'ja' } = userData;

        // Check if user exists
        const connection = await db.getConnection();
        try {
            const [existing] = await connection.execute(
                'SELECT user_id FROM USERS WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                return { success: false, message: 'Email already exists' };
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert User
            const [result] = await connection.execute(
                `INSERT INTO USERS (
          user_name, email, password_hash, preferred_language, 
          user_role, auth_provider, created_at
        ) VALUES (?, ?, ?, ?, 'general', 'local', NOW())`,
                [name, email, hashedPassword, preferred_language]
            );

            const userId = result.insertId;
            const token = this.generateToken(userId, 'general');

            return {
                success: true,
                token,
                user: { id: userId, name, email, role: 'general' }
            };

        } catch (error) {
            console.error('Register Error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Login User
    async login(email, password) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM USERS WHERE email = ? AND auth_provider = "local"',
                [email]
            );

            if (rows.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }

            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return { success: false, message: 'Invalid credentials' };
            }

            const token = this.generateToken(user.user_id, user.user_role);

            return {
                success: true,
                token,
                user: {
                    id: user.user_id,
                    name: user.user_name,
                    email: user.email,
                    role: user.user_role
                }
            };
        } finally {
            connection.release();
        }
    }

    // Google Login
    async googleLogin(idToken) {
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const email = payload.email;
            const name = payload.name;
            const googleId = payload.sub; // Google User ID

            const connection = await db.getConnection();
            try {
                // Check if user exists
                const [rows] = await connection.execute(
                    'SELECT * FROM USERS WHERE email = ?',
                    [email]
                );

                let user;
                if (rows.length > 0) {
                    user = rows[0];
                    // If user exists but via different provider, we could merge (complex) or just allow login
                    // For now, if local user exists with same email, we allow login but don't overwrite password
                    if (user.auth_provider === 'local') {
                        // Maybe update provider_id if needed, or just proceed
                    }
                } else {
                    // Create new user via Google
                    const [result] = await connection.execute(
                        `INSERT INTO USERS (
              user_name, email, preferred_language, 
              user_role, auth_provider, provider_id, created_at,
              verified_contributions
            ) VALUES (?, ?, 'ja', 'general', 'google', ?, NOW(), 0)`,
                        [name, email, googleId]
                    );
                    user = {
                        user_id: result.insertId,
                        user_name: name,
                        email: email,
                        user_role: 'general'
                    };
                }

                const token = this.generateToken(user.user_id, user.user_role);
                return {
                    success: true,
                    token,
                    user: {
                        id: user.user_id,
                        name: user.user_name,
                        email: user.email,
                        role: user.user_role
                    }
                };

            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            return { success: false, message: 'Google Authentication Failed' };
        }
    }

    generateToken(userId, role) {
        return jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '30d' }
        );
    }
}

module.exports = new AuthService();
