// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Admin from '../models/Admin.js';

/**
 * @desc Protect routes - Middleware to verify JWT and set req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin token or user token based on the role
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        // Fetch the admin from database
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
          res.status(401);
          throw new Error('Not authorized, admin not found');
        }
        req.user = admin;
        req.userType = 'admin';
      } else {
        // Fetch the user from database
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }
        req.user = user;
        req.userType = 'user';
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * @desc Admin protect middleware - Specifically for admin routes
 */
export const adminProtect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin token
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        // Fetch the admin from database
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
          res.status(401);
          throw new Error('Not authorized, admin not found');
        }
        req.admin = admin;
        next();
      } else {
        res.status(401);
        throw new Error('Not authorized, admin access required');
      }
    } catch (error) {
      console.error('Admin token verification error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * @desc Admin middleware - Checks if the authenticated user is an admin
 */
export const admin = (req, res, next) => {
  // Check if req.user exists and if the user is an admin
  if (req.user && (req.userType === 'admin' || req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next(); // User is an admin, proceed
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};
