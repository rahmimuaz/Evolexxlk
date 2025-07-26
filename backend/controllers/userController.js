import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Product from '../models/Product.js';
import { OAuth2Client } from 'google-auth-library';
import generateToken from '../utils/generateToken.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Add item to cart
// @route   POST /api/users/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error('Invalid product ID or quantity');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const existingCartItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingCartItem) {
    existingCartItem.quantity += quantity;
  } else {
    user.cart.push({ product: productId, quantity });
  }

  await user.save();

  const populatedUser = await User.findById(user._id).populate('cart.product');
  res.status(200).json(populatedUser.cart);
});

// @desc    Update product quantity in user cart
// @route   PUT /api/users/cart
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    const itemToUpdate = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (itemToUpdate) {
      itemToUpdate.quantity = quantity;
      await user.save();
      const populatedUser = await User.findById(req.user._id).populate('cart.product');
      res.status(200).json(populatedUser.cart);
    } else {
      res.status(404);
      throw new Error('Product not found in cart');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Remove product from user cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
const removeFromUserCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);

  if (user) {
    const initialCartLength = user.cart.length;
    user.cart = user.cart.filter((item) => item.product.toString() !== productId);

    if (user.cart.length === initialCartLength) {
      res.status(404);
      throw new Error('Product not found in cart');
    } else {
      await user.save();
      const populatedUser = await User.findById(req.user._id).populate('cart.product');
      res.status(200).json(populatedUser.cart);
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');

  if (user) {
    res.json(user.cart);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Clear user's entire cart
// @route   DELETE /api/users/cart
// @access  Private
const clearUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.cart = [];
  await user.save();

  res.status(200).json({ message: 'Cart cleared successfully' });
});

// @desc    Google login
// @route   POST /api/users/google-login
// @access  Public
export const googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        password: Math.random().toString(36),
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(401).json({ message: 'Google login failed' });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json(users);
});

// @desc    Delete a user and their reviews (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Step 1: Delete the user
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Step 2: Remove this user's reviews from all products
  const products = await Product.find({ 'reviews.user': userId });

  for (const product of products) {
    product.reviews = product.reviews.filter(
      (r) => r.user.toString() !== userId.toString()
    );

    product.numReviews = product.reviews.length;
    product.rating =
      product.numReviews > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.numReviews
        : 0;

    await product.save();
  }

  res.status(200).json({ message: 'User and associated reviews deleted successfully' });
});

export {
  authUser,
  registerUser,
  addToCart,
  updateCartItemQuantity,
  removeFromUserCart,
  getUserCart,
  clearUserCart,
};
