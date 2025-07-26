import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './OrderList.css';

const OrderList = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // State to manage expanded order rows
  const [expandedOrders, setExpandedOrders] = useState({});

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use API_BASE_URL for fetching orders
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders.');
      }

      const data = await response.json();

      const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Error fetching orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]); // Add API_BASE_URL to dependencies

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate statistics
  const calculateStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    // Removed pendingPayments as it was not explicitly used in the stats display
    // const pendingPayments = orders.filter(order => order.paymentStatus === 'pending').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      // pendingPayments
    };
  };

  const stats = calculateStats();

  const handleStatusChange = async (orderId, newStatus) => {
    if (!token) {
      setError('Not authenticated.');
      return;
    }
    try {
      // Use API_BASE_URL for updating order status
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status.');
      }

      if (newStatus === 'accepted') {
        // Remove the order from the local state since it's moved to ToBeShipped
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        toast.success('Order accepted! Redirecting to To Be Shipped List.');
        navigate('/ToBeShippedList');
      } else if (newStatus === 'declined') {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success('Order declined successfully!');
      } else {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success('Order status updated successfully!');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Error updating order status. Please try again.');
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    if (!token) {
      setError('Not authenticated.');
      return;
    }
    try {
      // Use API_BASE_URL for updating payment status
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment status.');
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
      );
      toast.success('Payment status updated successfully!');
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err.message || 'Error updating payment status. Please try again.');
    }
  };

  const handleDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!token || !orderToDelete) {
      setError('Not authenticated or no order selected for deletion.');
      return;
    }
    try {
      // Use API_BASE_URL for deleting order
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete order.');
      }

      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderToDelete));
      toast.success('Order deleted successfully!');
      setOrderToDelete(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(err.message || 'Error deleting order. Please try again.');
      setOrderToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setOrderToDelete(null);
    setShowDeleteModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'declined': return 'status-declined';
      case 'approved': return 'status-approved';
      case 'denied': return 'status-denied';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      default: return 'status-default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'payment-pending';
      case 'completed': return 'payment-completed';
      case 'failed': return 'payment-failed';
      default: return 'payment-default';
    }
  };

  const sortOrders = (ordersToSort) => {
    return [...ordersToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'total':
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || order.paymentStatus === filterPaymentStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || order.paymentMethod === filterPaymentMethod;

    const matchesSearch = debouncedSearchTerm === '' ||
                          order.orderNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          (order.user && order.user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.user && order.user.name && order.user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.shippingAddress && order.shippingAddress.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.shippingAddress && order.shippingAddress.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          order.orderItems.some(item =>
                            item.product && item.product.name && item.product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                          );
    return matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesSearch;
  });

  const sortedFilteredOrders = sortOrders(filteredOrders);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading Orders...</p>
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
    <div className="order-list-container">
      <div className="order-list-header">
        <h1 className="order-list-title">Order Management Dashboard</h1>
        <button
          onClick={fetchOrders}
          className="refresh-button"
          title="Refresh Orders"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon total-orders">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalOrders}</h3>
            <p className="stat-label">Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">${stats.totalRevenue.toFixed(2)}</h3>
            <p className="stat-label">Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.pendingOrders}</h3>
            <p className="stat-label">Pending Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.completedOrders}</h3>
            <p className="stat-label">Completed Orders</p>
          </div>
        </div>
      </div>

      <div className="filter-search-grid">
        <div className="filter-search-item">
          <label htmlFor="search" className="filter-search-label">
            Search Orders
          </label>
          <input
            type="text"
            id="search"
            className="filter-search-input"
            placeholder="Search by Order ID, User, Shipping, or Product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-search-item">
          <label htmlFor="statusFilter" className="filter-search-label">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            className="filter-search-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div className="filter-search-item">
          <label htmlFor="paymentStatusFilter" className="filter-search-label">
            Filter by Payment Status
          </label>
          <select
            id="paymentStatusFilter"
            className="filter-search-select"
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="filter-search-item">
          <label htmlFor="paymentMethodFilter" className="filter-search-label">
            Filter by Payment Method
          </label>
          <select
            id="paymentMethodFilter"
            className="filter-search-select"
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Card Payment</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div className="filter-search-item">
          <label htmlFor="sortBy" className="filter-search-label">
            Sort By
          </label>
          <select
            id="sortBy"
            className="filter-search-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Date</option>
            <option value="total">Total Amount</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="filter-search-item">
          <label htmlFor="sortOrder" className="filter-search-label">
            Sort Order
          </label>
          <select
            id="sortOrder"
            className="filter-search-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="results-summary">
        <p>Showing {sortedFilteredOrders.length} of {orders.length} orders</p>
      </div>

      {sortedFilteredOrders.length === 0 ? (
        <div className="no-orders-container">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="no-orders-message">No orders found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 order-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products & Quantities</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>{/* For expand button */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFilteredOrders.map(order => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-100 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link to={`/orders/${order._id}`} className="order-id-link">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 order-user-info">
                      {order.user ? `${order.user.name || 'N/A'}` : 'Deleted User'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <ul className="order-items-list-preview">
                          {order.orderItems.slice(0, 2).map((item, idx) => ( // Show first 2 items
                            <li key={idx}>
                              {item.product ? `${item.product.name}` : 'Unknown Product'} (x{item.quantity})
                            </li>
                          ))}
                          {order.orderItems.length > 2 && (
                            <li>... and {order.orderItems.length - 2} more items</li>
                          )}
                        </ul>
                      ) : 'No items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`status-select ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accept</option>
                        <option value="declined">Decline</option>
                        {/* Add other status options as needed, e.g., 'shipped', 'delivered' if relevant for this view */}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="action-button-view"
                          title="View Order Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="action-button-delete"
                          title="Delete Order"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm4 3a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" />
                          </svg>
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

                  {expandedOrders[order._id] && (
                    <tr className="expanded-details-row">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="expanded-details-content">
                          <div className="detail-group">
                            <strong>Order Date:</strong>{' '}
                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="detail-group">
                            <strong>User Email:</strong>{' '}
                            {order.user ? order.user.email : 'N/A'}
                          </div>
                          <div className="detail-group">
                            <strong>Shipping Address:</strong>{' '}
                            {order.shippingAddress ? (
                              <>
                                {order.shippingAddress.fullName}, {order.shippingAddress.address},{' '}
                                {order.shippingAddress.city}, {order.shippingAddress.postalCode},{' '}
                                {order.shippingAddress.phone}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </div>
                          <div className="detail-group">
                            <strong>All Products:</strong>
                            <ul className="order-items-list-full">
                              {order.orderItems && order.orderItems.length > 0 ? (
                                order.orderItems.map((item, idx) => (
                                  <li key={idx}>
                                    {item.product ? `${item.product.name}` : 'Unknown Product'} (x{item.quantity}) - ${item.price?.toFixed(2)} each
                                  </li>
                                ))
                              ) : (
                                <li>No items</li>
                              )}
                            </ul>
                          </div>
                          <div className="detail-group">
                            <strong>Payment Method:</strong>{' '}
                            <span className="payment-method-badge">
                              {order.paymentMethod === 'cod'
                                ? 'Cash on Delivery'
                                : order.paymentMethod === 'card'
                                ? 'Card Payment'
                                : order.paymentMethod === 'bank_transfer'
                                ? 'Bank Transfer'
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="detail-group">
                            <strong>Payment Status:</strong>{' '}
                            <select
                              value={order.paymentStatus}
                              onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                              className={`payment-select ${getPaymentStatusColor(order.paymentStatus)}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>
                          <div className="detail-group">
                            <strong>Payment Proof:</strong>
                            {order.paymentMethod === 'bank_transfer' && order.bankTransferProof ? (
                              <div className="proof-container">
                                {order.bankTransferProof.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                                  <div className="proof-image-preview">
                                    {/* UPDATED: Use order.bankTransferProof directly for Cloudinary images */}
                                    <img
                                      src={order.bankTransferProof}
                                      alt="Bank Transfer Proof"
                                      className="proof-thumbnail"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                      }}
                                    />
                                    <div className="proof-fallback" style={{ display: 'none', fontSize: '10px', color: '#999' }}>
                                      Image failed to load
                                    </div>
                                  </div>
                                )}
                                {/* UPDATED: Use order.bankTransferProof directly for Cloudinary links */}
                                <a
                                  href={order.bankTransferProof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="proof-link"
                                  title="View/Download Proof"
                                  onClick={async (e) => {
                                    try {
                                      // Check if the Cloudinary URL is accessible (optional but good practice)
                                      const res = await fetch(order.bankTransferProof, { method: 'HEAD' });
                                      if (!res.ok) {
                                        e.preventDefault();
                                        alert('Proof file not accessible. It might have been moved or deleted from Cloudinary.');
                                      }
                                    } catch (err) {
                                      console.error('Error checking proof URL:', err);
                                      e.preventDefault();
                                      alert('Network error or proof file not accessible. Please try again later.');
                                    }
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  {order.bankTransferProof.match(/\.pdf$/i) ? 'View PDF' : 'View Proof'}
                                </a>
                                {/* UPDATED: Use order.bankTransferProof directly for Cloudinary download links */}
                                <a
                                  href={order.bankTransferProof}
                                  download
                                  className="proof-download-link"
                                  title="Download File"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download
                                </a>
                              </div>
                            ) : (
                               // This part will now correctly display if there's no proof or if payment method isn't bank transfer
                               order.paymentMethod === 'bank_transfer' ? 'No proof uploaded.' : 'Not applicable'
                             )}
                          </div>
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

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="button-danger">Delete</button>
              <button onClick={cancelDelete} className="button-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;