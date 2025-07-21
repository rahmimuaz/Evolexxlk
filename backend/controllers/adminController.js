// controllers/adminController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

// Function to create default admin if none exists
const createDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      // Hash the password manually for the default admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword, // Use the hashed password
        role: 'super_admin'
      });
      await defaultAdmin.save();
      console.log('Default admin created successfully');
    } else {
      console.log('Admin already exists, skipping default admin creation');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Create default admin on server start
createDefaultAdmin();

/**
 * @desc Admin login function
 * @route POST /api/admin/login
 * @access Public
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email);

  // Basic request body validation
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Please enter both email and password.' });
  }

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    console.log('Admin found:', admin ? 'Yes' : 'No');

    if (!admin) {
      console.log('No admin found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.log('Admin account is inactive');
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    // Compare the provided password with the hashed password
    const isMatch = await admin.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for admin:', admin.email);

    // Send success response with token and admin info
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error during login process.' });
  }
};

/**
 * @desc Register new admin
 * @route POST /api/admin/register
 * @access Public
 */
export const registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic request body validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields: username, email, and password.' });
  }

  try {
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists.' });
    }

    // Check if admin with this username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Admin with this username already exists.' });
    }

    // Create new admin (password will be hashed automatically by the pre-save hook)
    const newAdmin = new Admin({
      username,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    await newAdmin.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email, role: newAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully!',
      token,
      user: {
        id: newAdmin._id,
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Error during admin registration:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.` });
    }
    
    res.status(500).json({ message: 'Server error during registration process.' });
  }
};

/**
 * @desc Verify admin token
 * @route GET /api/admin/verify-token
 * @access Private
 */
export const verifyToken = async (req, res) => {
  try {
    // The token is already verified by the auth middleware
    // We just need to return the admin info
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found.' });
    }
    
    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Server error during token verification.' });
  }
};
