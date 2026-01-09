const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
        req.user = decoded; // { id: 1, role: 'general' }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
