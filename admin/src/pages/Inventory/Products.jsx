import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Products.css';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchProducts();
  }, [API_BASE_URL]); // Add API_BASE_URL to the dependency array

  const fetchProducts = async () => {
    try {
      // Use the API_BASE_URL for fetching products
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err); // Log the error for debugging
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/EditProduct/${productId}`); // Ensure this path matches your router configuration
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      // Use the API_BASE_URL for deleting a product
      await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err); // Log the error for debugging
      alert('Error deleting product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-container">
      <div className="table-outer-wrapper">
        <div className="table-scroll-wrapper">
          <div className="table-inner-wrapper">
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Product ID</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-4 text-center text-sm text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr key={product._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.productId}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.category}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${product.price?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.stock === 0 ? (
                            <span style={{ color: 'white', background: 'red', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>Out of Stock</span>
                          ) : product.stock < 5 ? (
                            <span style={{ color: 'black', background: 'yellow', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>Low Stock ({product.stock})</span>
                          ) : (
                            product.stock
                          )}
                        </td>
                        <td className="whitespace-nowrap py-4 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEdit(product._id)}
                            className="action-button edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="action-button delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;