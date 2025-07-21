import express from 'express';
const router = express.Router();
import { authUser, registerUser, addToCart, updateCartItemQuantity, removeFromUserCart, getUserCart, clearUserCart, googleLogin } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/login', authUser);
router.route('/').post(registerUser);
router.post('/google-login', googleLogin);

// Protected routes for cart management
router.route('/cart')
  .post(protect, addToCart)
  .put(protect, updateCartItemQuantity)
  .get(protect, getUserCart)
  .delete(protect, clearUserCart);
router.route('/cart/:productId').delete(protect, removeFromUserCart);

export default router; 