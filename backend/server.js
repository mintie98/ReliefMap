const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // For development, we can be more permissive to allow smartphone testing
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

    // Always allow if no origin (mobile apps, etc.) or if we are in dev mode
    if (!origin || isDev) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
const locationsRoutes = require('./routes/locations');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');
const amenitiesRoutes = require('./routes/amenities');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/upload');

app.use('/api/locations', locationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ReliefMap API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.message);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: err.stack // Show stack temporarily to help user debug
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

