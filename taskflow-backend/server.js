const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Verify Supabase configuration
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const syllabusRoutes = require('./routes/syllabus');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/syllabus', syllabusRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Supabase'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'TaskFlow API',
    version: '1.0.0',
    database: 'Supabase',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      assignments: '/api/assignments',
      syllabus: '/api/syllabus'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║          TaskFlow Backend Server           ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                 ║
║  Database: Supabase                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                 ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
