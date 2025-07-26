import mongoose from 'mongoose';

const toBeShippedSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
  },
  // Add a direct reference to the user who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true, // This is crucial for user-specific fetching
  },
  customerName: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: String,
  postalCode: String,
  email: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['accepted', 'shipped', 'delivered'],
    default: 'accepted',
  },
  // --- NEW FIELDS: Directly copied from the Order document when moved ---
  orderNumber: { // New field
    type: String,
    required: true,
  },
  totalPrice: { // New field
    type: Number,
    required: true,
    default: 0.0,
  },
  paymentMethod: { // New field
    type: String,
    required: true,
  },
  // --- END NEW FIELDS ---
}, {
  timestamps: true,
});

// Use mongoose.models.ToBeShipped to prevent re-compilation in hot-reloading environments
const ToBeShipped = mongoose.models.ToBeShipped || mongoose.model('ToBeShipped', toBeShippedSchema);

export default ToBeShipped;