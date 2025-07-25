import mongoose from 'mongoose';

const generateProductId = () => {
  return 'PID-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

const mobilePhoneSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  storage: { type: String, required: true },
  ram: { type: String, required: true },
  color: { type: String, required: true },
  screenSize: { type: String, required: true },
  batteryCapacity: { type: String, required: true },
  processor: { type: String, required: true },
  camera: { type: String, required: true },
  operatingSystem: { type: String, required: true }
});

const mobileAccessoriesSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  type: { type: String, required: true },
  compatibility: { type: String, required: true },
  color: { type: String, required: true },
  material: { type: String, required: true }
});

const preownedPhoneSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  condition: { type: String, required: true },
  storage: { type: String, required: true },
  ram: { type: String, required: true },
  color: { type: String, required: true },
  batteryHealth: { type: String, required: true },
  warranty: { type: String, required: true }
});

const laptopSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  processor: { type: String, required: true },
  ram: { type: String, required: true },
  storage: { type: String, required: true },
  display: { type: String, required: true },
  graphics: { type: String, required: true },
  operatingSystem: { type: String, required: true }
});

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: generateProductId,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Mobile Phone', 'Mobile Accessories', 'Preowned Phones', 'Laptops', 'Phone Covers', 'Chargers']
  },
  price: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  warrantyPeriod: {
    type: String,
    default: 'No Warranty'
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Category-specific details
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  kokoPay: {
    type: Boolean,
    default: false
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product; 