// routes/adminRoutes.js
import express from 'express';
import { loginAdmin, registerAdmin, verifyToken } from '../controllers/adminController.js';
import { getAllUsers, deleteUser } from '../controllers/userController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/admin/login
 * @desc Authenticate admin and get token
 * @access Public
 */
router.post('/login', loginAdmin);

/**
 * @route POST /api/admin/register
 * @desc Register a new admin account
 * @access Public
 */
router.post('/register', registerAdmin);

/**
 * @route GET /api/admin/verify-token
 * @desc Verify admin token
 * @access Private
 */
router.get('/verify-token', adminProtect, verifyToken);

/**
 * @route GET /api/admin/users
 * @desc Get all users (admin only)
 * @access Private
 */
router.get('/users', adminProtect, getAllUsers);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user (admin only)
 * @access Private
 */
router.delete('/users/:id', adminProtect, deleteUser);

// You can add more admin-specific routes here, e.g.:
// router.get('/dashboard-stats', protect, adminMiddleware, getDashboardStats);
// where 'protect' is a middleware to verify JWT and 'adminMiddleware' checks user role.

export default router;
