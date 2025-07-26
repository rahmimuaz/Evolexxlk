import Order from '../models/Order.js';
import User from '../models/userModel.js';
import ToBeShipped from '../models/ToBeShipped.js'; // Import the ToBeShipped model
import Product from '../models/Product.js';

import asyncHandler from 'express-async-handler';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('orderItems.product') // Ensure product details are populated
    .sort({ createdAt: -1 });

  // Debug: Log order details
  console.log('=== ORDERS DEBUG ===');
  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}:`, {
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      bankTransferProof: order.bankTransferProof,
      hasProof: !!order.bankTransferProof,
      createdAt: order.createdAt,
      itemsCount: order.orderItems ? order.orderItems.length : 0 // Add item count
    });
    // Log details of the first item for debugging
    if (order.orderItems && order.orderItems.length > 0) {
      console.log(`  First Item Product Name: ${order.orderItems[0].product?.name}`);
      console.log(`  First Item Product Image: ${order.orderItems[0].product?.images?.[0]}`);
    }
  });
  console.log('=== END ORDERS DEBUG ===');

  res.status(200).json(orders);
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product'); // Ensure product details are populated

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.status(200).json(order);
});

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, bankTransferProof, orderItems, totalPrice } = req.body;

  // Debug: Log the received data
  console.log('Create Order Request Body:', {
    paymentMethod,
    bankTransferProof,
    hasProof: !!bankTransferProof,
    proofType: typeof bankTransferProof,
    orderItems: orderItems ? orderItems.length : 'not provided',
    totalPrice
  });

  if (!shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Missing required fields: shippingAddress and paymentMethod are required');
  }

  const requiredAddressFields = ['fullName', 'email', 'address', 'city', 'postalCode', 'phone'];
  const missingFields = requiredAddressFields.filter(field => !shippingAddress[field]);

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing required shipping address fields: ${missingFields.join(', ')}`);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let finalOrderItems;
  let finalTotalPrice;

  // Fetch product details for orderItems
  if (orderItems && orderItems.length > 0) {
    // For each item, fetch product details to ensure name, image, price, selectedColor are correct
    finalOrderItems = await Promise.all(orderItems.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(400);
        throw new Error(`Product not found: ${item.product}`);
      }
      return {
        product: item.product,
        quantity: item.quantity,
        price: product.price, // Use actual product price from DB to prevent tampering
        name: product.name, // Copy product name
        image: product.images && product.images.length > 0 ? product.images[0] : '', // Copy main image
        selectedColor: item.selectedColor || '' // Copy selected color if present
      };
    }));
    finalTotalPrice = finalOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    console.log('Using orderItems from request body (with product details fetched)');
  } else {
    // Fallback to cart items
    const userWithCart = await User.findById(req.user._id).populate('cart.product');
    if (!userWithCart.cart || userWithCart.cart.length === 0) {
      res.status(400);
      throw new Error('No items in cart');
    }

    finalOrderItems = userWithCart.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name, // Copy product name from populated cart item
      image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '', // Copy main image
      selectedColor: item.selectedColor || '' // Copy selected color if present in cart item
    }));
    finalTotalPrice = finalOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    console.log('Using cart items as fallback (with product details from populated cart)');
  }

  // Inventory check and deduction
  for (const item of finalOrderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }
  }
  // Deduct stock and check for low stock
  for (const item of finalOrderItems) {
    const updatedProduct = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (updatedProduct.stock > 0 && updatedProduct.stock < 5) {
      await sendEmail(
        process.env.ALERT_EMAIL_USER, // Ensure this ENV var is set for admin alerts
        'Low Stock Alert',
        `Product "${updatedProduct.name}" is low on stock. Only ${updatedProduct.stock} left.`
      );
    }
  }

  try {
    const orderNumber = await Order.generateOrderNumber(); // Assuming this is a static method on Order model

    const orderData = {
      orderNumber,
      user: req.user._id,
      orderItems: finalOrderItems, // Use the enriched finalOrderItems
      shippingAddress,
      paymentMethod,
      totalPrice: finalTotalPrice,
    };

    if (bankTransferProof && paymentMethod === 'bank_transfer') {
      orderData.bankTransferProof = bankTransferProof;
      console.log('Adding bankTransferProof to order:', bankTransferProof);
    } else {
      console.log('Not adding bankTransferProof:', {
        hasProof: !!bankTransferProof,
        paymentMethod,
        condition: bankTransferProof && paymentMethod === 'bank_transfer'
      });
    }

    console.log('Final order data:', orderData);

    const order = await Order.create(orderData);

    // Send new order email to admin
    await sendEmail(
      process.env.ALERT_EMAIL_USER,
      'New Order Received',
      `Evolexx Store\nNew Order Received\nA new order has been placed. Order ID: ${order._id}\n\nView Order: http://localhost:3000/admin/orders/${order._id}`
    );

    // Send order confirmation to user
    await sendEmail(
      order.shippingAddress.email,
      'Your Order Confirmation - Evolexx Store',
      `Thank you for your order at Evolexx Store!\n\nYour order has been received. Order ID: ${order._id}\n\nWe will notify you when your order is shipped.\n\nIf you have an account, you can view your order here: http://localhost:3000/orders/${order._id}`
    );

    // Clear cart only if we used cart items (i.e., orderItems were not provided in request body)
    if (!req.body.orderItems || req.body.orderItems.length === 0) {
      user.cart = [];
      await user.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    console.log('Created order with proof:', {
      orderId: populatedOrder._id,
      bankTransferProof: populatedOrder.bankTransferProof
    });

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500);
    throw new Error('Error creating order: ' + error.message);
  }
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'accepted', 'declined', 'approved', 'denied', 'shipped', 'delivered'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product'); // IMPORTANT: Populate product data for copying

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status === status) {
    res.status(400);
    throw new Error(`Order is already ${status}`);
  }

  // Common check for user data before creating ToBeShipped entry
  if ((status === 'accepted' || status === 'approved' || status === 'shipped' || status === 'delivered') &&
    (!order.user || !order.user._id || !order.shippingAddress || !order.orderItems || order.orderItems.length === 0)) {
    res.status(500);
    throw new Error(`Order user, shipping address, or order items data missing for shipment transfer.`);
  }

  if (status === 'accepted') {
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    try {
      // Map order items to copy only necessary data to ToBeShipped
      const copiedOrderItems = order.orderItems.map(item => ({
        product: item.product._id, // Reference to the original Product ID
        name: item.product.name,
        quantity: item.quantity,
        price: item.price, // Price from the order, not necessarily current product price
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
        selectedColor: item.selectedColor || '',
      }));

      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        user: order.user._id,
        orderNumber: order.orderNumber,
        customerName: order.user.name || order.shippingAddress.fullName || 'N/A', // Prioritize user name, then shipping name
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email || order.shippingAddress.email,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        status: 'accepted', // Initial status for ToBeShipped collection
        orderItems: copiedOrderItems, // Store the copied order items
      });

      // Delete the order from OrderList after moving to ToBeShipped
      await Order.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: 'Order accepted and moved to ToBeShipped collection.',
        toBeShippedEntry: toBeShippedEntry,
      });

    } catch (error) {
      console.error('Error during order acceptance and transfer to ToBeShipped:', error);
      res.status(500);
      throw new Error('Error processing order acceptance and transfer: ' + error.message);
    }
  }
  // If the status is 'approved' and you want to keep 'approved' as a separate flow
  // (e.g., admin approval before 'accepted' which moves it to ToBeShipped),
  // then you would define specific behavior here.
  // Given your current `ToBeShippedList` logic uses 'accepted', 'shipped', 'delivered',
  // it implies 'accepted' is the first status in the ToBeShipped lifecycle.
  // If 'approved' also means moving to ToBeShipped, then the 'accepted' block above should handle it.
  // For now, I'll remove the separate 'approved' block and assume 'accepted' is the one that moves it.
  // If you need distinct 'approved' -> OrderList then 'accepted' -> ToBeShipped, let me know.
  /*
  else if (status === 'approved') {
    // Current logic for 'approved' is same as 'accepted'
    // This part might be redundant if 'accepted' is the actual trigger for ToBeShipped
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    try {
      const copiedOrderItems = order.orderItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
        selectedColor: item.selectedColor || '',
      }));

      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        user: order.user._id,
        orderNumber: order.orderNumber,
        customerName: order.user.name || order.shippingAddress.fullName || 'N/A',
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email || order.shippingAddress.email,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        status: 'approved', // Or the correct initial status in ToBeShipped
        orderItems: copiedOrderItems,
      });

      await Order.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: 'Order status updated to approved and moved to ToBeShipped collection.',
        toBeShippedEntry: toBeShippedEntry,
      });

    } catch (error) {
      console.error('Error during order approval and transfer to ToBeShipped:', error);
      res.status(500);
      throw new Error('Error processing order approval and transfer: ' + error.message);
    }
  }
  */
  else {
    // Other status updates (pending, declined, denied, shipped, delivered)
    order.status = status;
    await order.save();

    // If order is shipped or delivered, consider updating the ToBeShipped entry's status
    // instead of deleting from Order. (Assuming order is *moved* from Order to ToBeShipped upon 'accepted')
    // If you don't delete from Order, you would check for an existing ToBeShipped entry here:
    if (status === 'shipped' || status === 'delivered') {
      const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
      if (existingToBeShipped) {
        existingToBeShipped.status = status;
        if (status === 'shipped') existingToBeShipped.shippedAt = new Date();
        if (status === 'delivered') existingToBeShipped.deliveredAt = new Date();
        await existingToBeShipped.save();
        console.log(`ToBeShipped entry for order ${order._id} updated to status: ${status}`);
      } else {
        console.warn(`Attempted to update ToBeShipped status for order ${order._id} but no ToBeShipped entry found.`);
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    res.status(200).json(updatedOrder);
  }
});

// @desc    Update payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
    res.status(400);
    throw new Error('Invalid payment status');
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    { new: true }
  ).populate('orderItems.product');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.status(200).json(order);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // If you decide not to delete the Order from OrderList when accepted,
  // but instead update its status to 'moved' or 'archived',
  // then ensure you also delete the corresponding ToBeShipped entry if it exists.
  await ToBeShipped.deleteOne({ orderId: req.params.id });

  res.status(200).json({ message: 'Order deleted successfully' });
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('orderItems.product');
  res.status(200).json(orders);
});

// @desc    Get orders from 'ToBeShipped' collection (Admin) - **This function is now redundant as logic is in toBeShippedRoutes.js**
// @route   GET /api/tobeshipped/list (Moved to toBeShippedRoutes)
// @access  Private/Admin
// export const getToBeShippedOrders = asyncHandler(async (req, res) => { /* ... */ });

// @desc    Test route to create order with bank transfer proof
// @route   POST /api/orders/test-bank-transfer
// @access  Private/Admin
export const testBankTransferOrder = asyncHandler(async (req, res) => {
  try {
    const dummyProductId = '60c72b2f9f1b2c001c8e4d2a'; // **REPLACE with an actual product ID from your DB**
    const product = await Product.findById(dummyProductId);

    if (!product) {
      res.status(400).json({ message: 'Dummy product not found. Please update dummyProductId in orderController.' });
      return;
    }

    const testOrderData = {
      orderNumber: await Order.generateOrderNumber(),
      user: req.user._id,
      orderItems: [
        {
          product: product._id,
          quantity: 1,
          price: product.price, // Use actual product price
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          selectedColor: 'Black' // Example color
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        email: 'test@example.com',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        phone: '1234567890'
      },
      paymentMethod: 'bank_transfer',
      totalPrice: product.price * 1, // Total price based on dummy product
      bankTransferProof: 'https://res.cloudinary.com/djp0x1vbx/image/upload/v1700000000/sample_proof.jpg' // Example Cloudinary URL
    };

    console.log('Creating test order with data:', testOrderData);

    const order = await Order.create(testOrderData);

    // No need to clear cart for a test order
    // user.cart = []; await user.save(); // Don't do this for test order

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    console.log('Test order created:', {
      orderId: populatedOrder._id,
      bankTransferProof: populatedOrder.bankTransferProof,
      hasProof: !!populatedOrder.bankTransferProof
    });

    res.status(201).json({
      message: 'Test order created successfully',
      order: populatedOrder
    });
  } catch (error) {
      console.error('Error creating test order:', error);
      res.status(500).json({ message: 'Error creating test order: ' + error.message });
  }
});