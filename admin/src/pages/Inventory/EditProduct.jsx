import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    longDescription: '',
    stock: '',
    details: {},
    images: [], // Existing images from the product
    warrantyPeriod: 'No Warranty',
    discountPrice: ''
  });

  const [newImages, setNewImages] = useState([]); // Newly selected files for upload
  const [previewUrls, setPreviewUrls] = useState([]); // URLs for both existing and new image previews
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const categories = [
    'Mobile Phone',
    'Mobile Accessories',
    'Preowned Phones',
    'Laptops',
    'Phone Covers',
    'Chargers'
  ];

  const categoryFields = {
    'Mobile Phone': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'storage', label: 'Storage' },
      { name: 'ram', label: 'RAM' },
      { name: 'color', label: 'Color' },
      { name: 'screenSize', label: 'Screen Size' },
      { name: 'batteryCapacity', label: 'Battery Capacity' },
      { name: 'processor', label: 'Processor' },
      { name: 'camera', label: 'Camera' },
      { name: 'operatingSystem', label: 'Operating System' }
    ],
    'Mobile Accessories': [
      { name: 'brand', label: 'Brand' },
      { name: 'type', label: 'Type' },
      { name: 'compatibility', label: 'Compatibility' },
      { name: 'color', label: 'Color' },
      { name: 'material', label: 'Material' }
    ],
    'Preowned Phones': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'condition', label: 'Condition' },
      { name: 'storage', label: 'Storage' },
      { name: 'ram', label: 'RAM' },
      { name: 'color', label: 'Color' },
      { name: 'batteryHealth', label: 'Battery Health' },
      { name: 'warranty', label: 'Warranty' }
    ],
    'Laptops': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'processor', label: 'Processor' },
      { name: 'ram', label: 'RAM' },
      { name: 'storage', label: 'Storage' },
      { name: 'display', label: 'Display' },
      { name: 'graphics', label: 'Graphics' },
      { name: 'operatingSystem', label: 'Operating System' }
    ]
  };

  const fetchProduct = useCallback(async () => {
    try {
      // Use API_BASE_URL for fetching product details
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
      const product = response.data;
      setFormData(product);

      const previewList = product.images.map(img => {
        if (img.startsWith('http')) {
          return img;
        } else {
          // Construct full URL for images stored locally
          return `${API_BASE_URL}/${img.replace(/^\//, '')}`;
        }
      });
      setPreviewUrls(previewList);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
      console.error("Error fetching product:", err); // Log the error for debugging
    }
  }, [id, API_BASE_URL]); // Add API_BASE_URL to dependencies

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = formData.images.length + newImages.length;
    const maxImages = 5; // Define max images allowed

    if (totalCurrentImages >= maxImages) {
      alert(`You have reached the maximum of ${maxImages} images.`);
      return;
    }

    const filesToAdd = Math.min(files.length, maxImages - totalCurrentImages);

    if (filesToAdd < files.length) {
      alert(`Only ${maxImages - totalCurrentImages} more image(s) can be added.`);
    }

    const validFiles = files.slice(0, filesToAdd);

    setNewImages(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    const totalExisting = formData.images.length;

    if (index < totalExisting) {
      // It's an existing image from the database
      const updatedExistingImages = [...formData.images];
      updatedExistingImages.splice(index, 1);
      setFormData(prev => ({ ...prev, images: updatedExistingImages }));
    } else {
      // It's a newly added image (not yet uploaded)
      const newImageIndex = index - totalExisting;
      const updatedNewImages = [...newImages];
      updatedNewImages.splice(newImageIndex, 1);
      setNewImages(updatedNewImages);
      // Revoke object URL for newly added image to prevent memory leaks
      URL.revokeObjectURL(previewUrls[index]);
    }

    // Remove from preview URLs regardless of whether it's existing or new
    const updatedPreviews = [...previewUrls];
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('longDescription', formData.longDescription);
    formDataToSend.append('warrantyPeriod', formData.warrantyPeriod);
    formDataToSend.append('discountPrice', formData.discountPrice);
    formDataToSend.append('stock', formData.stock);
    formDataToSend.append('details', JSON.stringify(formData.details));
    
    // Send existing image URLs to the backend so it knows which ones to keep
    formDataToSend.append('existingImages', JSON.stringify(formData.images));

    // Append new image files for upload
    newImages.forEach(file => {
      formDataToSend.append('images', file);
    });

    try {
      // Use API_BASE_URL for updating product details
      await axios.put(`${API_BASE_URL}/api/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Product updated successfully!');
      navigate('/Products'); // Navigate to the product list
    } catch (err) {
      console.error('Update failed:', err);
      alert('Error updating product. Please try again.');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="edit-product-container">
      <h1 className="edit-product-title">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="edit-product-form-section">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              className="form-textarea"
            />
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="form-label">Long Description</label>
            <textarea
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              rows="6"
              className="form-textarea"
              placeholder="Enter a more detailed description (optional)"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Warranty Period</label>
            <select
              name="warrantyPeriod"
              value={formData.warrantyPeriod}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="No Warranty">No Warranty</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="2 years">2 years</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Discount/Offer Price</label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter offer price (optional)"
              min="0"
            />
          </div>
        </div>

        <div className="edit-product-form-section">
          <h2 className="section-title">Product Details</h2>
          <div className="form-grid">
            {formData.category && categoryFields[formData.category]?.map(field => (
              <div key={field.name} className="form-field">
                <label className="form-label">{field.label}</label>
                {field.name === 'color' ? (
                  <>
                    <input
                      type="text"
                      name="color"
                      value={Array.isArray(formData.details.color) ? formData.details.color.join(', ') : (formData.details.color || '')}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          details: {
                            ...prev.details,
                            color: value.split(',').map(c => c.trim()).filter(Boolean)
                          }
                        }));
                      }}
                      required
                      className="form-input"
                      placeholder="e.g. Red, Black, Gray"
                    />
                    <small>Enter multiple colors separated by commas</small>
                  </>
                ) : (
                  <input
                    type="text"
                    name={field.name}
                    value={formData.details[field.name] || ''}
                    onChange={handleDetailChange}
                    required
                    className="form-input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="edit-product-form-section">
          <h2 className="section-title">Product Images</h2>
          <div className="image-preview-grid">
            {previewUrls.map((url, index) => (
              <div key={index} className="image-preview-item group">
                <img src={url} alt={`Image ${index}`} className="image-preview-img" />
                <button type="button" onClick={() => removeImage(index)} className="remove-image-button">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="form-field">
            <label className="form-label">Add New Images (Max 5 total)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
              // Disable input if 5 images already exist
              disabled={formData.images.length + newImages.length >= 5}
            />
             {formData.images.length + newImages.length >= 5 && (
                <p className="text-red-500 text-sm mt-1">Maximum 5 images allowed.</p>
              )}
          </div>
        </div>

        <div className="submit-button-container">
          <button type="submit" className="submit-button">
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;