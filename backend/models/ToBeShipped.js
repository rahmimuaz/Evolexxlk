import mongoose from 'mongoose';

const toBeShippedSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Reference to the original Order model (for historical lookup if needed)
    required: true,
    unique: true, // Ensure one ToBeShipped entry per Order
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
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const ToBeShipped = mongoose.models.ToBeShipped || mongoose.model('ToBeShipped', toBeShippedSchema);

export default ToBeShipped;
