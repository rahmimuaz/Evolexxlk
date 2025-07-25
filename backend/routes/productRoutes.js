// backend/routes/productRoutes.js
import express from 'express';
import upload from '../middleware/upload.js';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  addReview,
  getReviews,
  getLowStockProducts,
  getOutOfStockProducts,
  searchProducts
} from '../controllers/productController.js';

import { protect } from '../middleware/authMiddleware.js'; // <--- ADD THIS LINE to import protect

const router = express.Router();

// Create a new product with image upload (Cloudinary)
router.post('/', protect, createProduct); // You might want to protect product creation too
// If createProduct is for admin only: router.post('/', protect, admin, createProduct);

// Get all products
router.get('/', getProducts);

// Get products by category — must come BEFORE getProduct('/:id') route
router.get('/category/:category', getProductsByCategory);

// Product search (by name) - must come before /:id
router.get('/search', searchProducts);

// Get a single product by ID
router.get('/:id', getProduct);

// Update a product (with optional image upload)
router.put('/:id', protect, updateProduct); // You might want to protect product update too
// If updateProduct is for admin only: router.put('/:id', protect, admin, updateProduct);

// Delete a product and its images
router.delete('/:id', protect, deleteProduct); // You might want to protect product deletion too
// If deleteProduct is for admin only: router.delete('/:id', protect, admin, deleteProduct);

// Add a review to a product
router.post('/:id/reviews', protect, addReview); // <--- THIS IS THE CRUCIAL CHANGE!
// Get all reviews for a product
router.get('/:id/reviews', getReviews); // Reviews can still be viewed publicly

// Get low-stock products - typically admin only
router.get('/admin/low-stock', protect, getLowStockProducts); // <--- Add protect if it's an admin route
// Get out-of-stock products - typically admin only
router.get('/admin/out-of-stock', protect, getOutOfStockProducts); // <--- Add protect if it's an admin route

export default router;