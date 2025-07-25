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

import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Create a new product with image upload (Cloudinary)
router.post('/', upload.array('images', 5), createProduct);

// Get all products
router.get('/', getProducts);

// Get products by category — must come BEFORE getProduct('/:id') route
router.get('/category/:category', getProductsByCategory);

// Product search (by name) - must come before /:id
router.get('/search', searchProducts);

// Get a single product by ID
router.get('/:id', getProduct);

// Update a product (with optional image upload)
router.put('/:id', upload.array('images', 5), updateProduct);

// Delete a product and its images
router.delete('/:id', deleteProduct);

// Add a review to a product
router.post('/:id/reviews', protect, addReview); // <--- THIS IS THE CRUCIAL CHANGE!
// Get all reviews for a product
router.get('/:id/reviews', getReviews);

// Get low-stock products
router.get('/admin/low-stock', getLowStockProducts);
// Get out-of-stock products
router.get('/admin/out-of-stock', getOutOfStockProducts);

export default router;
