const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');

class UserController {
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const token = await UserService.register(req.body);
            res.status(201).json({
                success: true,
                token
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await UserService.login(email, password);
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await UserService.getUserProfile(req.user.userId);
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
