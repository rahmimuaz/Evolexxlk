import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ToBeShippedList.css';

const ToBeShippedList = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchToBeShipped = async () => {
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Use API_BASE_URL for fetching to-be-shipped orders
        const response = await fetch(`${API_BASE_URL}/api/orders/tobeshipped`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch to-be-shipped orders.');
        }

        const data = await response.json();
        console.log('ToBeShipped data received:', data);
        setOrders(data);
      } catch (err) {
        console.error('Error fetching to-be-shipped orders:', err);
        setError(err.message || 'Error fetching to-be-shipped orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchToBeShipped();
  }, [token, API_BASE_URL]); // Add API_BASE_URL to dependencies

  const downloadPdf = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Shipping Label - Order #${order.orderId?.orderNumber || 'N/A'}`, 10, 15);
    doc.setFontSize(12);

    let yPos = 30;

    doc.text('Customer Details:', 10, yPos);
    yPos += 7;
    doc.text(`  Name: ${order.customerName || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Email: ${order.email || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Phone: ${order.mobileNumber || 'N/A'}`, 10, yPos);

    yPos += 15;

    doc.text('Shipping Address:', 10, yPos);
    yPos += 7;
    doc.text(`  Address: ${order.address}`, 10, yPos);
    yPos += 7;
    doc.text(`  City: ${order.city}`, 10, yPos);
    yPos += 7;
    doc.text(`  Postal Code: ${order.postalCode}`, 10, yPos);

    yPos += 15;

    doc.text('Order Information:', 10, yPos);
    yPos += 7;
    doc.text(`  Order Number: ${order.orderId?.orderNumber || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Total Price: $${order.orderId?.totalPrice?.toFixed(2) || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Payment Method: ${order.orderId?.paymentMethod || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Payment Status: ${order.paymentStatus}`, 10, yPos);

    doc.save(`Shipping_Label_Order_${order.orderId?.orderNumber || 'Unknown'}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading To Be Shipped Orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  return (
    <div className="shipped-list-container">
      <h2 className="shipped-list-title">To Be Shipped Orders</h2>
      {orders.length === 0 ? (
        <div className="no-orders-container">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="no-orders-message">No orders currently approved for shipment.</p>
        </div>
      ) : (
        <div className="shipped-table-wrapper">
          <table className="shipped-table">
            <thead>
              <tr>
                <th className="shipped-table th">Order ID</th>
                <th className="shipped-table th">Customer</th>
                <th className="shipped-table th">Mobile</th>
                <th className="shipped-table th">Email</th>
                <th className="shipped-table th">Address</th>
                <th className="shipped-table th">Status</th>
                <th className="shipped-table th">Total Price</th>
                <th className="shipped-table th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="shipped-table td order-id-cell">
                    {order.orderId?.orderNumber || 'N/A'}
                  </td>
                  <td className="shipped-table td">
                    {order.customerName || 'N/A'}
                  </td>
                  <td className="shipped-table td">
                    {order.mobileNumber || 'N/A'}
                  </td>
                  <td className="shipped-table td">
                    {order.email || 'N/A'}
                  </td>
                  <td className="shipped-table td">
                    <div className="address-display">
                      <p className="address-line">{order.address}</p>
                      <p className="address-city">{order.city}, {order.postalCode}</p>
                    </div>
                  </td>
                  <td className="shipped-table td">
                    <span className={`payment-status-badge ${getStatusColor(order.status)}`}>
                      {order.status || 'accepted'}
                    </span>
                  </td>
                  <td className="shipped-table td total-price-cell">
                    ${order.orderId?.totalPrice?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="shipped-table td text-right">
                    <div className="action-buttons">
                      <button
                        onClick={() => downloadPdf(order)}
                        className="download-button"
                        title="Download Shipping Label"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ToBeShippedList;