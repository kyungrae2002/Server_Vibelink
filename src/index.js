require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const preferenceRoutes = require('./routes/preference');
const playlistRoutes = require('./routes/playlist');

// Validate environment variables before starting
validateEnv();

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy - CRITICAL for Render deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080'
        ];

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true, // Changed to true for better initial connection
  cookie: {
    secure: false, // Set to false for local development (HTTP)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Always use 'lax' for OAuth flows
    path: '/'
    // Don't set domain in development - let it default to current host
  },
  name: 'vibelink.sid',
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production (Render uses proxy)
}));

// Swagger documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.log('Swagger documentation not available');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/preference', preferenceRoutes);
app.use('/api/playlist', playlistRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VibeLink Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to VibeLink API',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Bind to 127.0.0.1 in development, 0.0.0.0 in production
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, HOST, () => {
  const address = HOST === '0.0.0.0' ? 'all interfaces' : `http://${HOST}:${PORT}`;
  console.log(`VibeLink Server is running on ${address} (port ${PORT})`);
  console.log(`API Documentation available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api-docs`);
});

module.exports = app;
