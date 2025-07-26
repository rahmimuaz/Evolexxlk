import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import ToBeShipped from '../models/ToBeShipped.js';
// No longer strictly need to import Order here if we're not populating its specific fields
// import Order from '../models/Order.js';

const router = express.Router();

// @desc    Get all ToBeShipped orders (for admin)
// @route   GET /api/tobeshipped/list
// @access  Private/Admin
router.get('/list', protect, admin, async (req, res) => {
  try {
    console.log('[toBeShippedRoutes] Fetching to-be-shipped list...');
    const list = await ToBeShipped.find()
      .sort({ createdAt: -1 })
      // Option 1: Remove populate('orderId') entirely if you truly don't need *any* original Order data
      // .populate('user', 'name email');

      // Option 2 (Recommended if orderId ref still useful for debugging or future expansion):
      // Populate orderId just for its _id or minimal fields, as the other data is copied
      .populate('orderId', '_id') // Only populate _id from Order, as orderNumber, totalPrice, etc. are now direct
      .populate('user', 'name email');


    // --- CRITICAL DEBUGGING LOGS (Adjusted to access direct fields) ---
    if (list.length > 0) {
      console.log('--- Debugging ToBeShipped List (First Item) ---');
      console.log('ToBeShipped _id:', list[0]._id);
      console.log('Populated orderId (raw):', JSON.stringify(list[0].orderId, null, 2)); // This will now show the _id if populated
      console.log('Accessing orderNumber (direct):', list[0].orderNumber); // <--- Access directly from ToBeShipped
      console.log('Accessing totalPrice (direct):', list[0].totalPrice);     // <--- Access directly from ToBeShipped
      console.log('Accessing paymentMethod (direct):', list[0].paymentMethod); // <--- Access directly from ToBeShipped
      console.log('--- End Debugging ---');

      // The warning for null/undefined orderId.orderNumber should now ideally not fire
      // because you are accessing `list[0].orderNumber` directly.
      if (!list[0].orderNumber) { // Check the directly stored field
        console.warn('[toBeShippedRoutes] WARNING: orderNumber is null/undefined for the first item AFTER COPYING!');
      }
    } else {
      console.log('[toBeShippedRoutes] No ToBeShipped orders found in the database.');
    }
    // --- END CRITICAL DEBUGGING LOGS ---

    res.status(200).json(list);
  } catch (error) {
    console.error('[toBeShippedRoutes] Error fetching to-be-shipped list:', error);
    res.status(500).json({ message: 'Error fetching to-be-shipped list: ' + error.message });
  }
});

// @desc    Get logged in user's ToBeShipped orders
// @route   GET /api/tobeshipped/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const userToBeShippedOrders = await ToBeShipped.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderId', '_id') // Only populate _id from Order here too
      .populate('user', 'name email');

    res.status(200).json(userToBeShippedOrders);
  } catch (error) {
    console.error('[toBeShippedRoutes] Error fetching user\'s to-be-shipped orders:', error);
    res.status(500).json({ message: 'Error fetching your orders.' });
  }
});

// The commented-out '/accept-order' route logic remains unchanged.

export default router;