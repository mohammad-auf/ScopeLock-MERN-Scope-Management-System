require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const scopeRoutes = require('./routes/scopeRoutes');
const requestRoutes = require('./routes/requestRoutes');
const changeOrderRoutes = require('./routes/changeOrderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Restricted to CLIENT_ORIGIN env var (Section 21)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Request Logger (Section 23) ─────────────────────────────────────────────
// Logs method, path, status, and response time; never logs JWT or passwords
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Never log Authorization header (contains JWT)
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/scope-items', scopeRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/notifications', notificationRoutes);
// Public client portal (no JWT; token-authenticated)
app.use('/api/portal', portalRoutes);

// Health check (used by Render deployment)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 catch-all for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'API endpoint not found' },
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

module.exports = app;
