import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './ToBeShippedList.css'; // ALL IMPORTS MUST BE AT THE TOP

// Place any non-import statements AFTER all imports.
// This workaround for jsPDF-autotable's global dependency.
if (typeof window !== 'undefined' && !window.jsPDF) {
  window.jsPDF = jsPDF;
}

const getImageUrl = (imagePath) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${baseUrl}${imagePath}`;
  if (imagePath.startsWith('uploads/')) return `${baseUrl}/${imagePath}`;
  return `${baseUrl}/uploads/${imagePath}`;
};

const ToBeShippedList = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

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
        const response = await fetch(`${API_BASE_URL}/api/tobeshipped/list`, {
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
  }, [token, API_BASE_URL]);

  const downloadPdf = (order) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Shipping Label - Order #${order.orderNumber || 'N/A'}`, 10, 15);
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
    doc.text(`  Order Number: ${order.orderNumber || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Total Price: Rs. ${order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 }) || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Payment Method: ${order.paymentMethod || 'N/A'}`, 10, yPos);
    yPos += 7;
    doc.text(`  Payment Status: ${order.paymentStatus}`, 10, yPos);

    yPos += 15;
    doc.text('Order Items:', 10, yPos);

    const tableColumn = ["Product", "Qty", "Price"];
    const tableRows = [];

    order.orderItems.forEach(item => {
      const itemData = [
        `${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''}`,
        item.quantity,
        `Rs. ${item.price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
      }
    });

    doc.save(`Shipping_Label_Order_${order.orderNumber || 'Unknown'}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleImageError = (e) => {
    e.target.classList.add('hidden-image');
    e.target.nextElementSibling.classList.remove('hidden-placeholder');
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
              <tr><th className="shipped-table th">Order ID</th><th className="shipped-table th">Customer</th><th className="shipped-table th">Mobile</th><th className="shipped-table th">Email</th><th className="shipped-table th">Address</th><th className="shipped-table th">Status</th><th className="shipped-table th">Total Price</th><th className="shipped-table th">Actions</th><th className="shipped-table th"></th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-100 transition-colors duration-150">
                    <td className="shipped-table td order-id-cell">{order.orderNumber || 'N/A'}</td>
                    <td className="shipped-table td">{order.customerName || 'N/A'}</td>
                    <td className="shipped-table td">{order.mobileNumber || 'N/A'}</td>
                    <td className="shipped-table td">{order.email || 'N/A'}</td>
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
                      Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 }) || 'N/A'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => toggleExpand(order._id)} className="expand-toggle-button">
                        {expandedOrders[order._id] ? 'Show Less' : 'Show More'}
                        <svg
                          className={`w-4 h-4 ml-1 transform ${expandedOrders[order._id] ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {expandedOrders[order._id] && order.orderItems && order.orderItems.length > 0 && (
                    <tr className="expanded-details-row">
                      <td colSpan="9" className="px-6 py-4 bg-gray-50 expanded-items-cell">
                        <h4 className="text-md font-semibold text-gray-700 mb-3">Products in this Shipment:</h4>
                        <div className="product-items-container">
                          {order.orderItems.map((item, index) => (
                            <div key={index} className="product-item-card">
                              <div className="product-image-wrapper">
                                {item.image ? (
                                  <>
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={item.name}
                                      className="product-thumbnail"
                                      onError={handleImageError}
                                    />
                                    <div className="product-image-placeholder-small hidden-placeholder">
                                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  </>
                                ) : (
                                  <div className="product-image-placeholder-small">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="product-details-content">
                                <p className="font-semibold">{item.name}</p>
                                {item.selectedColor && <p className="text-gray-600 text-sm">Color: {item.selectedColor}</p>}
                                <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                                <p className="text-gray-800 font-medium">Rs. {item.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ToBeShippedList;