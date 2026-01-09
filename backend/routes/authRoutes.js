const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');

// Register
router.post('/register', authController.register);

// Login (Email/Password)
router.post('/login', authController.login);

// Google Login
router.post('/google', authController.googleLogin);

module.exports = router;
