import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getMyOrders,
  // getToBeShippedOrders, // <-- REMOVED: This function will no longer be used via this router
  testBankTransferOrder
} from '../controllers/orderController.js'; // Ensure correct imports
import { protect, admin } from '../middleware/authMiddleware.js'; // Ensure authMiddleware is correctly implemented

const router = express.Router();

// All orders (Admin) & Create Order - Requires authentication and admin role for GET, protect for POST
router.route('/').get(protect, admin, getOrders).post(protect, createOrder);

// Test route for bank transfer proof
router.post('/test-bank-transfer', protect, admin, testBankTransferOrder);

// IMPORTANT: REMOVED THE REDUNDANT TO BE SHIPPED ROUTE FROM HERE
// router.get('/tobeshipped', protect, admin, getToBeShippedOrders);

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