// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import practitionerRoutes from './routes/practitionerRoutes';
import serviceRoutes from './routes/serviceRoutes';
import programRoutes from './routes/programRoutes';
import testimonialRoutes from './routes/testimonialRoutes';
import contactRoutes from './routes/contactRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  
  // Create subdirectories
  const subDirs = ['images', 'documents', 'practitioners', 'services', 'programs', 'testimonials', 'misc'];
  subDirs.forEach(dir => {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/practitioners', practitionerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Detox Wellness & Rehabilitation Center API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      appointments: '/api/appointments',
      practitioners: '/api/practitioners',
      services: '/api/services',
      programs: '/api/programs',
      testimonials: '/api/testimonials',
      contact: '/api/contact',
      notifications: '/api/notifications',
      uploads: '/api/uploads'
    },
    documentation: 'https://your-api-docs-url.com'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Too many files or unexpected field name.' });
  }
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'A record with this information already exists.' });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📁 Static Files: http://localhost:${PORT}/uploads`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🛠️  Available API Endpoints:`);
    console.log(`   Auth:           http://localhost:${PORT}/api/auth`);
    console.log(`   Admin:          http://localhost:${PORT}/api/admin`);
    console.log(`   Appointments:   http://localhost:${PORT}/api/appointments`);
    console.log(`   Practitioners:  http://localhost:${PORT}/api/practitioners`);
    console.log(`   Services:       http://localhost:${PORT}/api/services`);
    console.log(`   Programs:       http://localhost:${PORT}/api/programs`);
    console.log(`   Testimonials:   http://localhost:${PORT}/api/testimonials`);
    console.log(`   Contact:        http://localhost:${PORT}/api/contact`);
    console.log(`   Notifications:  http://localhost:${PORT}/api/notifications`);
    console.log(`   Uploads:        http://localhost:${PORT}/api/uploads`);
    console.log(`\n📊 Health Check:   http://localhost:${PORT}/health`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;