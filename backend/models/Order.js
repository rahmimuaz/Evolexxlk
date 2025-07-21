// Order.js Modal
import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'approved', 'denied', 'shipped', 'delivered'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    bankTransferProof: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to generate unique order number with retry
orderSchema.statics.generateOrderNumber = async function () {
  let orderNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 5) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    orderNumber = `OID-${randomNum}`;
    exists = await this.exists({ orderNumber });
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate unique order number');
  }

  return orderNumber;
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;