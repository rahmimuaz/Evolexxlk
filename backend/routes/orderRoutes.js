import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getMyOrders,
  getToBeShippedOrders,
  testBankTransferOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js'; // Ensure authMiddleware is correctly implemented

const router = express.Router();

// All orders (Admin) - Requires authentication and admin role
router.route('/').get(protect, admin, getOrders).post(protect, createOrder);

// Test route for bank transfer proof
router.post('/test-bank-transfer', protect, admin, testBankTransferOrder);

// To Be Shipped Orders - Requires authentication and admin role
router.get('/tobeshipped', protect, admin, getToBeShippedOrders);

// My Orders - Requires authentication
router.get('/myorders', protect, getMyOrders);

// Order by ID - Requires authentication
router.get('/:id', protect, getOrderById);

// Update order status - Requires authentication and admin role
router.patch('/:id/status', protect, admin, updateOrderStatus);

// Update payment status - Requires authentication and admin role
router.patch('/:id/payment', protect, admin, updatePaymentStatus);

// Delete order - Requires authentication and admin role
router.delete('/:id', protect, admin, deleteOrder);

export default router;
