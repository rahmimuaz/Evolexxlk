import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    longDescription: '',
    stock: '',
    details: {},
    warrantyPeriod: 'No Warranty',
    discountPrice: '',
    kokoPay: false
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'discountPrice') {
      if (value && Number(value) > Number(formData.price)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else {
        setDiscountError('');
      }
    }
    if (name === 'price' && formData.discountPrice) {
      if (Number(formData.discountPrice) > Number(value)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else {
        setDiscountError('');
      }
    }
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
    if (files.length + selectedFiles.length > 5) {
      alert('You can only upload up to 5 images.');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please upload at least one image.');
      return;
    }
    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      alert('Discount/Offer price cannot be greater than Price.');
      return;
    }

    setLoading(true);
    try {
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
      formDataToSend.append('kokoPay', formData.kokoPay);

      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      // Use the API_BASE_URL here
      const response = await axios.post(`${API_BASE_URL}/api/products`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        alert('Product added successfully!');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h1 className="add-product-title">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="add-product-form-section">
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
              rows="3"
              className="form-textarea"
            />
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="form-label">Long Description</label>
            <SimpleMDE
              value={formData.longDescription}
              onChange={value => setFormData(prev => ({ ...prev, longDescription: value }))}
              options={{ placeholder: 'Enter a more detailed description (supports Markdown formatting)' }}
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
            {discountError && <div className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{discountError}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">
              <input
                type="checkbox"
                name="kokoPay"
                checked={formData.kokoPay}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Enable KOKO Pay (3 installments)
            </label>
          </div>
        </div>

        {formData.category && (
          <div className="add-product-form-section">
            <h2 className="section-title">Product Details</h2>
            <div className="form-grid">
              {categoryFields[formData.category].map(field => (
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
        )}

        <div className="add-product-form-section">
          <h2 className="section-title">Product Images</h2>
          <div className="image-upload-area">
            <div className="image-upload-content">
              <div className="image-upload-text-wrapper">
                <label className="image-upload-label">
                  <span>Upload images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-upload-input-hidden"
                  />
                </label>
              </div>
              <p className="image-upload-hint">PNG, JPG, JPEG — max 5 images</p>
            </div>
          </div>

          {previewUrls.length > 0 && (
            <div className="image-previews-grid">
              {previewUrls.map((url, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="image-preview-img"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="remove-image-button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="submit-button-container">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Uploading...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;