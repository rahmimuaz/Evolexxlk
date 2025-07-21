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
    .populate('orderItems.product')
    .sort({ createdAt: -1 });
  
  // Debug: Log order details
  console.log('=== ORDERS DEBUG ===');
  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}:`, {
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      bankTransferProof: order.bankTransferProof,
      hasProof: !!order.bankTransferProof,
      createdAt: order.createdAt
    });
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
    .populate('orderItems.product');

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

  // Use orderItems from request body if provided, otherwise use cart
  let finalOrderItems;
  let finalTotalPrice;

  if (orderItems && orderItems.length > 0) {
    finalOrderItems = orderItems;
    finalTotalPrice = totalPrice || orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    console.log('Using orderItems from request body');
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
    }));
    finalTotalPrice = finalOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    console.log('Using cart items as fallback');
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
        process.env.ALERT_EMAIL_USER,
        'Low Stock Alert',
        `Product "${updatedProduct.name}" is low on stock. Only ${updatedProduct.stock} left.`
      );
    }
  }

  try {
    const orderNumber = await Order.generateOrderNumber();

    // Create order object with conditional bankTransferProof
    const orderData = {
      orderNumber,
      user: req.user._id,
      orderItems: finalOrderItems,
      shippingAddress,
      paymentMethod,
      totalPrice: finalTotalPrice,
    };

    // Only add bankTransferProof if it exists and payment method is bank_transfer
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

    // Clear cart only if we used cart items
    if (!orderItems || orderItems.length === 0) {
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
    .populate('orderItems.product');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (status === 'accepted') {
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    if (!order.user || !order.shippingAddress) {
      res.status(500);
      throw new Error('Order user or shipping address data missing for shipment transfer.');
    }

    try {
      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        customerName: order.user.name || 'N/A',
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email,
        paymentStatus: order.paymentStatus,
        status: 'accepted',
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
  } else if (status === 'approved') {
    // Keep the existing approved logic for backward compatibility
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    if (!order.user || !order.shippingAddress) {
      res.status(500);
      throw new Error('Order user or shipping address data missing for shipment transfer.');
    }

    try {
      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        customerName: order.user.name || 'N/A',
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email,
        paymentStatus: order.paymentStatus,
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
  } else {
    order.status = status;
    await order.save();

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

  res.status(200).json({ message: 'Order deleted successfully' });
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('orderItems.product');
  res.status(200).json(orders);
});

// @desc    Get orders from 'ToBeShipped' collection
// @route   GET /api/orders/tobeshipped
// @access  Private/Admin
export const getToBeShippedOrders = asyncHandler(async (req, res) => {
  try {
    console.log('=== FETCHING TO BE SHIPPED ORDERS ===');
    
    const toBeShippedOrders = await ToBeShipped.find()
      .populate({
        path: 'orderId',
        select: 'orderNumber totalPrice paymentMethod createdAt',
      })
      .sort({ createdAt: -1 });

    console.log('Found to-be-shipped orders:', toBeShippedOrders.length);
    toBeShippedOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order._id,
        customerName: order.customerName,
        orderNumber: order.orderId?.orderNumber,
        totalPrice: order.orderId?.totalPrice,
        paymentStatus: order.paymentStatus
      });
    });

    res.status(200).json(toBeShippedOrders);
  } catch (error) {
    console.error('[getToBeShippedOrders] Error fetching to-be-shipped orders in controller:', error);
    throw new Error('Failed to retrieve to-be-shipped orders: ' + error.message);
  }
});

// @desc    Test route to create order with bank transfer proof
// @route   POST /api/orders/test-bank-transfer
// @access  Private/Admin
export const testBankTransferOrder = asyncHandler(async (req, res) => {
  try {
    const testOrderData = {
      orderNumber: await Order.generateOrderNumber(),
      user: req.user._id,
      orderItems: [
        {
          product: '507f1f77bcf86cd799439011', // Dummy product ID
          quantity: 1,
          price: 100
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
      totalPrice: 100,
      bankTransferProof: 'https://res.cloudinary.com/test/image/upload/test-proof.jpg'
    };

    console.log('Creating test order with data:', testOrderData);

    const order = await Order.create(testOrderData);
    
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
