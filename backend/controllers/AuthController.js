const authService = require('../services/AuthService');

class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const result = await authService.register(req.body);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Missing credentials' });
            }

            const result = await authService.login(email, password);
            if (!result.success) {
                return res.status(401).json(result);
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async googleLogin(req, res, next) {
        try {
            const { token } = req.body; // Expecting { token: "google_id_token" }
            if (!token) {
                return res.status(400).json({ success: false, message: 'Google Token ID required' });
            }

            const result = await authService.googleLogin(token);
            if (!result.success) {
                return res.status(401).json(result);
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
