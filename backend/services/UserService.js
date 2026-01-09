const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');

class UserService {
    async register(userData) {
        const existingUser = await UserRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const userId = await UserRepository.create({
            ...userData,
            password_hash: hashedPassword,
            auth_provider: 'local',
            provider_id: null
        });

        return this.generateToken(userId);
    }

    async login(email, password) {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.password_hash) {
            throw new Error('Invalid method. Please login with ' + user.auth_provider);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user.user_id);
        return {
            token,
            user: {
                id: user.user_id,
                name: user.user_name,
                email: user.email,
                role: user.user_role
            }
        };
    }

    async getUserProfile(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Remove sensitive data
        delete user.password_hash;
        return user;
    }

    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your_jwt_secret_key_change_me',
            { expiresIn: '7d' }
        );
    }
}

module.exports = new UserService();
