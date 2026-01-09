const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const UserController = require('../controllers/UserController');
const auth = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('user_name').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters')
];

// Routes
router.post('/register', registerValidation, (req, res) => UserController.register(req, res));
router.post('/login', (req, res) => UserController.login(req, res));
router.get('/profile', auth, (req, res) => UserController.getProfile(req, res));

module.exports = router;
