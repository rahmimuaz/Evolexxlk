// backend/controllers/productController.js
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice } = req.body;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Product must have at least one image' });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: 'Product cannot have more than 5 images' });
    }

    // Extract image paths from uploaded files
    const images = req.files.map(file => file.path);

    // Validate required fields
    if (!name || !category || !price || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, category, price, and description are required' 
      });
    }

    // Parse details if provided
    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON in details field' });
      }
    }

    // Validate category-specific details
    const requiredFields = {
      'Mobile Phone': ['brand', 'model', 'storage', 'ram', 'color', 'screenSize', 'batteryCapacity', 'processor', 'camera', 'operatingSystem'],
      'Mobile Accessories': ['brand', 'type', 'compatibility', 'color', 'material'],
      'Preowned Phones': ['brand', 'model', 'condition', 'storage', 'ram', 'color', 'batteryHealth', 'warranty'],
      'Laptops': ['brand', 'model', 'processor', 'ram', 'storage', 'display', 'graphics', 'operatingSystem']
    };

    const categoryFields = requiredFields[category];
    if (categoryFields) {
      const missingFields = categoryFields.filter(field => !parsedDetails[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields for ${category}: ${missingFields.join(', ')}` 
        });
      }
    }

    const newProduct = new Product({
      name,
      category,
      price: parseFloat(price),
      description,
      longDescription,
      images,
      stock: parseInt(stock) || 0,
      details: parsedDetails,
      warrantyPeriod: warrantyPeriod || 'No Warranty',
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product with this ID already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating product. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice } = req.body;
    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;

    // Get the current product to compare images
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let existingImages = [];
    if (req.body.existingImages) {
      existingImages = JSON.parse(req.body.existingImages);
    }

    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.path);
    }

    const updatedImages = [...existingImages, ...newImages];

    if (updatedImages.length === 0 || updatedImages.length > 5) {
      return res.status(400).json({ message: 'Product must have 1–5 images' });
    }

    // Find images that were removed (in current product but not in updated images)
    const removedImages = currentProduct.images.filter(img => !updatedImages.includes(img));

    // Delete removed images from Cloudinary
    if (removedImages.length > 0) {
      const deletePromises = removedImages.map(async (imageUrl) => {
        // Only delete Cloudinary images (URLs starting with http)
        if (imageUrl.startsWith('http')) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = imageUrl.split('/');
            const filenameWithExtension = urlParts[urlParts.length - 1];
            const filename = filenameWithExtension.split('.')[0];
            const publicId = `products/${filename}`;
            
            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
          } catch (err) {
            console.error(`❌ Failed to delete image ${imageUrl} from Cloudinary:`, err.message);
          }
        } else {
          // For local files, we could delete them from the uploads folder
          console.log(`📁 Local image removed: ${imageUrl}`);
        }
      });

      await Promise.all(deletePromises);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: parseFloat(price),
        description,
        longDescription,
        images: updatedImages,
        stock: parseInt(stock) || 0,
        details: parsedDetails,
        warrantyPeriod: warrantyPeriod || 'No Warranty',
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete product and its images
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        // Handle Cloudinary URLs
        if (imageUrl.startsWith('http')) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = imageUrl.split('/');
            const filenameWithExtension = urlParts[urlParts.length - 1];
            const filename = filenameWithExtension.split('.')[0];
            const publicId = `products/${filename}`;
            
            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
          } catch (err) {
            console.error(`❌ Failed to delete image ${imageUrl} from Cloudinary:`, err.message);
          }
        } else {
          // Handle local files (if any)
          console.log(`📁 Local image: ${imageUrl}`);
        }
      });

      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product and images deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a review to a product
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const review = {
      user: req.user ? req.user._id : null, // If you have auth, otherwise set to null
      rating,
      comment,
      date: new Date()
    };
    product.reviews.push(review);
    await product.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reviews for a product
export const getReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('reviews');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(Array.isArray(product.reviews) ? product.reviews : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low-stock products (stock < 5)
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0, $lt: 5 } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get out-of-stock products (stock = 0)
export const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: 0 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search products by name (case-insensitive, partial match)
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(200).json([]);
    }
    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Search error:', error);
    console.error(error.stack);
    // Always return an array on error to prevent frontend issues
    res.status(500).json([]);
  }
};
