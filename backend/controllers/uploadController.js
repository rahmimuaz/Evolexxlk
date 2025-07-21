import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';

console.log('Upload Controller: Using centralized Cloudinary config');

// Configure multer storage for Cloudinary using the centralized config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bank-transfer-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Limit image size
  },
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Check file type
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  },
});

/**
 * @desc Upload bank transfer proof
 * @route POST /api/upload/bank-transfer-proof
 * @access Private
 */
export const uploadBankTransferProof = [
  // Apply multer middleware first
  upload.single('proof'),
  
  // Then handle the request
  asyncHandler(async (req, res) => {
    try {
      console.log('=== UPLOAD REQUEST RECEIVED ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      console.log('Request headers:', req.headers);
      
      // Check for multer errors
      if (req.fileValidationError) {
        console.error('File validation error:', req.fileValidationError);
        return res.status(400).json({ message: req.fileValidationError });
      }

      if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ message: 'Please select a file to upload' });
      }

      // The file is already uploaded to Cloudinary by multer-storage-cloudinary
      const fileUrl = req.file.path;
      
      console.log('File uploaded successfully:', {
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype
      });
      
      res.status(200).json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error stack:', error.stack);
      
      // More specific error messages
      if (error.message.includes('cloudinary')) {
        res.status(500).json({ message: 'Cloudinary upload failed. Please check your configuration.' });
      } else if (error.message.includes('file')) {
        res.status(400).json({ message: 'File upload error: ' + error.message });
      } else {
        res.status(500).json({ message: 'Error uploading file to Cloudinary: ' + error.message });
      }
    }
  })
]; 