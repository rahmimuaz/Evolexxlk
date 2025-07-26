import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import upload from './middleware/upload.js'; // Cloudinary-based multer

// Import product controller functions (no routes imported here) - This block can likely be removed if you're using productRoutes
// import {
//   getProducts,
//   getProduct,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   getProductsByCategory,
// } from './controllers/productController.js';

// Import your route files
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';
import toBeShippedRoutes from './routes/toBeShippedRoutes.js'; // <--- NEW: Import the ToBeShipped routes


dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Serve static files from uploads directory (if you store uploads locally)
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Use routers for modular routes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tobeshipped', toBeShippedRoutes); // <--- NEW: Use the ToBeShipped routes under '/api/tobeshipped'




// Test Cloudinary endpoint (keep this if you use Cloudinary)
app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const cloudinary = (await import('./config/cloudinary.js')).default; // Adjust path as needed
    const result = await cloudinary.api.ping();
    res.json({
      message: 'Cloudinary connection successful',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

// Error handling middleware (should be last before 404 handler)
app.use((err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  // Handle specific errors for better client feedback
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  }

  if (err.name === 'ValidationError') { // Mongoose validation errors
    return res.status(400).json({ message: 'Validation error: ' + err.message });
  }

  // Custom file validation errors
  if (err.message && err.message.includes('Only image and PDF files are allowed')) {
    return res.status(400).json({ message: err.message });
  }

  // Generic internal server error
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined // Only show full error in development
  });
});

// 404 handler (if no route matched - should be after all other routes and middleware)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});