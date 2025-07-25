// backend/controllers/productController.js

import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import userModel from '../models/userModel.js'; // Ensure this matches your User model file name and export

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Find all products
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get single product by ID
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice, kokoPay } = req.body;

    // Check if files were uploaded (assuming 'req.files' comes from a multer setup with cloudinary)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Product must have at least one image.' });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: 'Product cannot have more than 5 images.' });
    }

    // Extract image paths (Cloudinary URLs) from uploaded files
    const images = req.files.map(file => file.path);

    // Validate essential fields
    if (!name || !category || !price || !description || stock === undefined || stock === null) {
      return res.status(400).json({
        message: 'Missing required fields: name, category, price, description, and stock are required.'
      });
    }

    // Parse details if provided (handle stringified JSON or direct object)
    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON format for product details.' });
      }
    }

    // Validate category-specific details (as per your Product.js schema)
    const requiredCategoryFields = {
      'Mobile Phone': ['brand', 'model', 'storage', 'ram', 'color', 'screenSize', 'batteryCapacity', 'processor', 'camera', 'operatingSystem'],
      'Mobile Accessories': ['brand', 'type', 'compatibility', 'color', 'material'],
      'Preowned Phones': ['brand', 'model', 'condition', 'storage', 'ram', 'color', 'batteryHealth', 'warranty'],
      'Laptops': ['brand', 'model', 'processor', 'ram', 'storage', 'display', 'graphics', 'operatingSystem']
    };

    const categoryFields = requiredCategoryFields[category];
    if (categoryFields) {
      const missingFields = categoryFields.filter(field => !parsedDetails[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required details for ${category}: ${missingFields.join(', ')}`
        });
      }
    }

    const newProduct = new Product({
      name,
      category,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined, // Optional
      description,
      longDescription, // Optional
      images,
      stock: parseInt(stock),
      warrantyPeriod: warrantyPeriod || 'No Warranty', // Optional
      details: parsedDetails, // Ensure this is an object
      kokoPay: kokoPay === 'true' || kokoPay === true // Handle boolean from form-data
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);

  } catch (error) {
    console.error('Error creating product:', error);

    // Mongoose validation error for required fields or types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    // Handle duplicate ID if 'productId' was manually set and is not unique
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A product with this ID already exists. Please try again.'
      });
    }

    res.status(500).json({
      message: 'Failed to create product. Please check the provided data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined // Show detailed error in dev
    });
  }
};

// Update an existing product
export const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice, kokoPay } = req.body;

    const productToUpdate = await Product.findById(req.params.id);
    if (!productToUpdate) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON format for product details.' });
      }
    }

    // Handle existing images and new uploads
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages); // Assume it comes as a stringified array
      } catch (e) {
        existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]; // Fallback for single image or malformed string
      }
      existingImages = existingImages.filter(Boolean); // Remove any null/undefined/empty strings
    }

    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.path); // Cloudinary URLs from multer
    }

    const updatedImages = [...existingImages, ...newImages];

    // Image validation after combining
    if (updatedImages.length === 0 || updatedImages.length > 5) {
      // If no new files and no existing images are kept
      if (updatedImages.length === 0) {
        return res.status(400).json({ message: 'Product must have at least one image.' });
      }
      // If too many images after combining
      if (updatedImages.length > 5) {
        // You might want to prune new images if total exceeds 5, or just error
        return res.status(400).json({ message: 'Product cannot have more than 5 images.' });
      }
    }

    // Find images that were removed from the product and delete them from Cloudinary
    const imagesToDeleteFromCloudinary = productToUpdate.images.filter(
      (img) => img.startsWith('http') && !updatedImages.includes(img)
    );

    if (imagesToDeleteFromCloudinary.length > 0) {
      const deletePromises = imagesToDeleteFromCloudinary.map(async (imageUrl) => {
        try {
          // Extract public_id from Cloudinary URL (e.g., https://res.cloudinary.com/xyz/image/upload/v123/products/abc.jpg -> products/abc)
          const urlParts = imageUrl.split('/');
          const filenameWithExtension = urlParts[urlParts.length - 1];
          const filename = filenameWithExtension.split('.')[0];
          const publicId = `products/${filename}`; // Assuming 'products/' is your Cloudinary upload folder
          await cloudinary.uploader.destroy(publicId);
          console.log(`Cloudinary: Successfully deleted ${publicId}`);
        } catch (cloudinaryError) {
          console.error(`Cloudinary: Failed to delete image ${imageUrl}. Error: ${cloudinaryError.message}`);
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
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        description,
        longDescription,
        images: updatedImages, // Set the final combined array of images
        stock: parseInt(stock),
        warrantyPeriod,
        details: parsedDetails,
        kokoPay: kokoPay === 'true' || kokoPay === true
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update attempt.' });
    }

    res.status(200).json(updatedProduct);

  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    res.status(500).json({
      message: 'Failed to update product. Please check the provided data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a product and its associated Cloudinary images
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        if (imageUrl.startsWith('http')) { // Only attempt to delete Cloudinary URLs
          try {
            const urlParts = imageUrl.split('/');
            const filenameWithExtension = urlParts[urlParts.length - 1];
            const filename = filenameWithExtension.split('.')[0];
            const publicId = `products/${filename}`; // Assuming 'products/' is your Cloudinary upload folder
            await cloudinary.uploader.destroy(publicId);
            console.log(`Cloudinary: Successfully deleted ${publicId}`);
          } catch (cloudinaryError) {
            console.error(`Cloudinary: Failed to delete image ${imageUrl}. Error: ${cloudinaryError.message}`);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product and associated images deleted successfully.' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Add a review to a product
export const addReview = async (req, res) => {
  try {
    // Assuming req.user is set by your authentication middleware and contains _id
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required to add a review.' });
    }

    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if the user has already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user && r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product.' });
    }

    const review = {
      user: req.user._id, // User's ObjectId from authentication middleware
      rating: Number(rating), // Ensure rating is a number
      comment,
      date: new Date() // Use `date` field as per your Product schema review subdocument
    };

    product.reviews.push(review);

    // Update product's aggregate review statistics
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    // After saving, re-fetch the product to ensure the newly added review's user data is populated.
    // This provides the frontend with the user's 'name' immediately.
    const savedProductWithPopulatedReviews = await Product.findById(productId).populate({
        path: 'reviews.user',
        select: 'name', // Select only the 'name' field from the User model
        model: userModel // Explicitly specify the User model to populate from
    });

    // Find the newly added review from the fully populated product object
    const newReview = savedProductWithPopulatedReviews.reviews.find(
        (r) => r.user && r.user._id.toString() === req.user._id.toString()
    );

    res.status(201).json({ message: 'Review added successfully', review: newReview });

  } catch (error) {
    console.error('Error adding review:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message }); // Mongoose validation errors
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get all reviews for a product
export const getReviews = async (req, res) => {
  try {
    // Find the product by ID and select only the 'reviews' field, then populate the 'user' field within reviews
    const product = await Product.findById(req.params.id).select('reviews').populate({
      path: 'reviews.user',  // Path to the 'user' field within each review in the 'reviews' array
      select: 'name',        // Select only the 'name' field from the referenced User document
      model: userModel       // Explicitly tell Mongoose to use your userModel for population
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Ensure reviews is an array before sending (it should be, but good for robustness)
    res.status(200).json(Array.isArray(product.reviews) ? product.reviews : []);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get products with stock less than 5 but greater than 0
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0, $lt: 5 } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get products with stock equal to 0
export const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: 0 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Search products by name (case-insensitive, partial match)
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(200).json([]); // Return empty array if query is empty
    }
    // Use regex for case-insensitive partial matching
    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};