const express = require('express');
const router = express.Router();

// Placeholder for user routes
router.get('/health', (req, res) => {
  res.json({ message: 'Users route is working' });
});

module.exports = router;

