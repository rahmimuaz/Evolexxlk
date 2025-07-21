import express from 'express';
import { uploadBankTransferProof } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload bank transfer proof
router.post('/bank-transfer-proof', protect, uploadBankTransferProof);

export default router; 