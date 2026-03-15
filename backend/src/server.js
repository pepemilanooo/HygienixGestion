const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const locationRoutes = require('./routes/locations');
const interventionRoutes = require('./routes/interventions');
const tipoInterventoRoutes = require('./routes/tipiIntervento');
const tecnicoRoutes = require('./routes/tecnici');
const prodottoRoutes = require('./routes/prodotti');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');
const preventiviRoutes = require('./routes/preventivi');
const fattureRoutes = require('./routes/fatture');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (necessario per Railway)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.some(o => origin === o)) return cb(null, true);
    if (origin.endsWith('.up.railway.app') || origin.endsWith('.railway.app')) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads) - crea la directory se non esiste (utile su Railway con volume)
const fs = require('fs');
const uploadPath = process.env.UPLOAD_PATH || './uploads';
const uploadFullPath = path.isAbsolute(uploadPath) ? uploadPath : path.join(__dirname, '..', uploadPath);
['', 'documents', 'signatures', 'photos', 'reports'].forEach(sub => {
  const dir = sub ? path.join(uploadFullPath, sub) : uploadFullPath;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use('/uploads', express.static(uploadFullPath));

// Request logging in dev
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/tipi-intervento', tipoInterventoRoutes);
app.use('/api/tecnici', tecnicoRoutes);
app.use('/api/prodotti', prodottoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/preventivi', preventiviRoutes);
app.use('/api/fatture', fattureRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint non trovato' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Prisma connection');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hygienix Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL?.split('?')[0] || 'not configured'}`);
});

module.exports = app;
