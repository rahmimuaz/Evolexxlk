// screens/ToBeShippedDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify'; // Import toast for consistent error messages
import '../components/OrderDetails/OrderDetails.css'; // Adjust the path as needed

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ToBeShippedDetailScreen = () => {
  const { id } = useParams(); // This 'id' is the _id of the ToBeShipped document
  const { user } = useUser();
  const navigate = useNavigate(); // Initialize useNavigate
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep error state for specific messages

  useEffect(() => {
    const fetchToBeShippedOrder = async () => {
      const token = user?.token;

      if (!token) {
        setLoading(false);
        // Use toast for consistency, then navigate
        toast.error('Authentication token not found. Please log in.');
        navigate('/login'); // Or home, depending on your flow
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
        const { data } = await axios.get(`${API_BASE_URL}/api/tobeshipped/order/${id}`, config);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ToBeShipped order details:', err);
        // Use toast for consistency
        const errorMessage = err.response?.data?.message || 'Failed to load shipment details.';
        toast.error(errorMessage);
        setError(errorMessage); // Keep error state for display if needed
        setLoading(false);
        navigate('/'); // Redirect to home on fetch error
      }
    };

    if (user) {
      fetchToBeShippedOrder();
    } else {
      // If user is not logged in, redirect immediately
      setLoading(false);
      navigate('/login'); // Or home
    }
  }, [id, user, navigate]); // Add navigate to dependencies

  // Since ToBeShipped orders don't have product images or order items in this schema,
  // we'll remove the `getImageUrl` and `handleImageError` functions.
  // If you later add `orderItems` to ToBeShipped, you'd reintroduce them.

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

  // If there's an error and order is null, display the error
  if (error && !order) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="not-found-center-text">
            <h2 className="not-found-title">{error}</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!order) { // Fallback if order is null after loading, without an explicit error
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="not-found-center-text">
            <h2 className="not-found-title">Shipment details not found.</h2>
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
              {/* Note: ToBeShipped documents have `orderNumber` directly */}
              <h1 className="order-id-title">Shipment Details for Order #{order.orderNumber || 'N/A'}</h1>
              <div className="order-status-badges">
                {/* ToBeShipped 'status' can be 'accepted', 'shipped', 'delivered' */}
                <span className={`order-status-badge ${
                  order.status === 'delivered' ? 'status-delivered' :
                  order.status === 'shipped' ? 'status-shipped' :
                  order.status === 'accepted' ? 'status-approved' : // Map 'accepted' to 'status-approved' style
                  'status-default'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                {/* ToBeShipped 'paymentStatus' (copied from original order) */}
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
              <button className="back-home-btn" onClick={() => navigate('/myorders')}> {/* Go back to My Orders */}
                Back to My Orders
              </button>
            </div>
          </div>

          {/* Shipping and Payment Info */}
          <div className="info-section">
            <div className="info-grid">
              <div className="info-card">
                <h2 className="info-heading">Shipping Information</h2>
                <div className="info-details-group">
                  {/* ToBeShipped has customerName, email, mobileNumber, address, city, postalCode directly */}
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
                  {/* ToBeShipped has paymentMethod and paymentStatus directly */}
                  <p><span className="font-medium">Method:</span> {order.paymentMethod || 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> {order.paymentStatus || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items - This section is commented out as ToBeShipped schema doesn't currently store orderItems */}
          {/* If you add orderItems to your ToBeShipped schema, you can uncomment and adapt this section */}
          {/*
          <div className="order-items-section">
            <h2 className="info-heading">Order Items</h2>
            <div className="order-items-list">
              {order.orderItems && order.orderItems.map((item) => (
                <div key={item._id} className="order-item">
                  <div className="order-item-details">
                    <img
                      src={getImageUrl(item.product.images[0])}
                      alt={item.product.name}
                      className="product-image"
                      onError={handleImageError}
                    />
                    <div className="product-info">
                      <h3 className="product-name">{item.product.name}</h3>
                      {item.selectedColor && (
                        <p className="product-color">Color: {item.selectedColor}</p>
                      )}
                      <p className="product-quantity">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="item-total-price">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          */}
            <div className="order-items-section">
            <h2 className="info-heading">Order Items</h2>
            <p className="no-items-message">Order items are not stored in this shipment record. Please refer to your original order for details if available.</p>
            {/* If you add orderItems to your ToBeShipped schema, replace this message with the rendering logic */}
            </div>


          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-content">
              <h2 className="summary-heading">Total</h2>
              {/* ToBeShipped has totalPrice directly */}
              <p className="total-price">Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 }) || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToBeShippedDetailScreen;