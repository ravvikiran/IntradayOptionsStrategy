const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nseRoutes = require('./routes/nseRoutes');
const signalRoutes = require('./routes/signalRoutes');
const learningRoutes = require('./routes/learningRoutes');
const journalRoutes = require('./routes/journalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Compression for all responses
app.use(compression());

// Security headers via Helmet (relaxed CSP for development)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many requests', message: 'Please wait before making more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for signal generation (expensive NSE calls)
const signalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Rate limited', message: 'Signal generation is limited to 10 requests per minute. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/signals', signalLimiter);
app.use('/api/', apiLimiter);

// Health endpoint (useful for monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    memoryUsage: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
  });
});

// API Routes
app.use('/api/nse', nseRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/journal', journalRoutes);

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from client build
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath, {
    maxAge: '1d',
    etag: true,
  }));
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Options Signal Engine v2.0`);
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
