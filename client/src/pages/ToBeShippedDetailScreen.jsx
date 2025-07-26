// screens/ToBeShippedDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import '../components/OrderDetails/OrderDetails.css'; // Adjust the path as needed

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Utility function for getting image URLs, copied from OrderList/OrderDetails
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
  if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
  return `${API_BASE_URL}/uploads/${imagePath}`; // Default fallback if no prefix
};

const ToBeShippedDetailScreen = () => {
  const { id } = useParams(); // This 'id' is the _id of the ToBeShipped document
  const { user } = useUser();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToBeShippedOrder = async () => {
      const token = user?.token;

      if (!token) {
        setLoading(false);
        toast.error('Authentication token not found. Please log in.');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        // Ensure your backend `tobeshippedRoutes.js` route for fetching a single order
        // populates the `orderItems.product` field if you need detailed product info
        // beyond what's stored directly in the ToBeShipped orderItems array (e.g., product description).
        // For image and name, which are copied, direct access from order.orderItems is fine.
        const { data } = await axios.get(`${API_BASE_URL}/api/tobeshipped/order/${id}`, config);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ToBeShipped order details:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load shipment details.';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        // It's often better to redirect to a list or home, not necessarily login again if session exists
        // You might want a specific 'Not Found' page or just go back to the list of shipments.
        navigate('/ToBeShippedList'); // Redirect to ToBeShippedList on fetch error
      }
    };

    if (user) {
      fetchToBeShippedOrder();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [id, user, navigate]);

  // Image error handler for product images
  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Hide the broken image
    e.target.nextSibling.style.display = 'flex'; // Show the placeholder
  };

  if (loading) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <p style={{ textAlign: 'center', padding: '50px 0', fontSize: '1.1rem', color: '#555' }}>
            Loading shipment details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="not-found-center-text">
            <h2 className="not-found-title">{error}</h2>
            <button onClick={() => navigate('/ToBeShippedList')} className="btn btn-primary mt-4">
              Back to Shipments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="not-found-center-text">
            <h2 className="not-found-title">Shipment details not found.</h2>
            <button onClick={() => navigate('/ToBeShippedList')} className="btn btn-primary mt-4">
              Back to Shipments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page-container">
      <div className="order-details-max-width-wrapper">
        <div className="order-details-card">
          {/* Order Header */}
          <div className="order-header">
            <div className="order-header-content">
              <h1 className="order-id-title">Shipment Details for Order #{order.orderNumber || 'N/A'}</h1>
              <div className="order-status-badges">
                <span className={`order-status-badge ${
                  order.status === 'delivered' ? 'status-delivered' :
                  order.status === 'shipped' ? 'status-shipped' :
                  order.status === 'accepted' ? 'status-approved' :
                  'status-default'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`payment-status-badge ${
                  order.paymentStatus === 'completed' ? 'payment-completed' :
                  order.paymentStatus === 'failed' ? 'payment-failed' :
                  'payment-pending'
                }`}>
                  Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
            <p className="order-placed-date">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <div className="back-home-button-wrapper">
              <button className="back-home-btn" onClick={() => navigate('/ToBeShippedList')}>
                Back to To Be Shipped List
              </button>
            </div>
          </div>

          {/* Shipping and Payment Info */}
          <div className="info-section">
            <div className="info-grid">
              <div className="info-card">
                <h2 className="info-heading">Shipping Information</h2>
                <div className="info-details-group">
                  <p><span className="font-medium">Name:</span> {order.customerName || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {order.email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {order.mobileNumber || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {order.address || 'N/A'}</p>
                  <p><span className="font-medium">City:</span> {order.city || 'N/A'}</p>
                  <p><span className="font-medium">Postal Code:</span> {order.postalCode || 'N/A'}</p>
                </div>
              </div>

              <div className="info-card">
                <h2 className="info-heading">Payment Information</h2>
                <div className="info-details-group">
                  <p><span className="font-medium">Method:</span> {order.paymentMethod || 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> {order.paymentStatus || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items - NOW UNCOMMENTED AND POPULATED */}
          {order.orderItems && order.orderItems.length > 0 ? (
            <div className="order-items-section">
              <h2 className="info-heading">Order Items</h2>
              <div className="order-items-list">
                {order.orderItems.map((item) => (
                  <div key={item._id || item.product} className="order-item"> {/* Use item._id or item.product for key */}
                    <div className="order-item-details">
                      <div className="product-image-wrapper-sm">
                        {item.image ? (
                          <>
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="product-image"
                              onError={handleImageError}
                            />
                            <div className="product-image-placeholder-small" style={{ display: 'none' }}>
                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                          </>
                        ) : (
                          <div className="product-image-placeholder-small">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{item.name}</h3> {/* Use item.name directly from copied data */}
                        {item.selectedColor && (
                          <p className="product-color">Color: {item.selectedColor}</p>
                        )}
                        <p className="product-quantity">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="item-total-price">
                      Rs. {(item.price * item.quantity).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="order-items-section">
              <h2 className="info-heading">Order Items</h2>
              <p className="no-items-message">No product items found for this shipment.</p>
            </div>
          )}


          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-content">
              <h2 className="summary-heading">Total</h2>
              <p className="total-price">Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 }) || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToBeShippedDetailScreen;