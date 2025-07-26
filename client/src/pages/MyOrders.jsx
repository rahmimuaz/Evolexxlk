import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import './MyOrders.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const pendingOrdersPromise = axios.get(`${API_BASE_URL}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const shippedOrdersPromise = axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const [pendingOrdersRes, shippedOrdersRes] = await Promise.all([
          pendingOrdersPromise,
          shippedOrdersPromise
        ]);

        // Add a 'type' identifier to each order to distinguish them
        const pendingOrders = pendingOrdersRes.data.map(order => ({ ...order, type: 'Order' }));
        const shippedOrders = shippedOrdersRes.data.map(order => ({ ...order, type: 'ToBeShipped' }));

        const combinedOrders = [...pendingOrders, ...shippedOrders];

        // Sort orders by creation date (most recent first)
        combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log('Combined orders for MyOrders:', combinedOrders); // Debugging
        setOrders(combinedOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err.message || err);
        setError('Failed to fetch orders. Please try again.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) return <div className="orders-message">Please log in to view your orders.</div>;
  if (loading) return <div className="orders-message">Loading your orders...</div>;
  if (error) return <div className="orders-message error">{error}</div>;

  return (
    <div className="orders-container">
      <h2 className="orders-heading">My Orders</h2>
      {orders.length === 0 ? (
        <div className="orders-message">No orders found.</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                {/* Display order number directly for both types now */}
                <td>{order.orderNumber || 'N/A'}</td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</td>
                <td>Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                <td>{order.status || 'N/A'}</td>
                <td>
                  {/* CRITICAL CHANGE HERE: Link to different routes based on type */}
                  {order.type === 'Order' ? (
                    <Link to={`/order/${order._id}`}>View Details</Link>
                  ) : order.type === 'ToBeShipped' ? (
                    // You need a new detail page for ToBeShipped orders,
                    // or modify your existing order detail page to handle ToBeShipped data.
                    // For now, let's link to a placeholder or directly use the ToBeShipped ID
                    // This implies creating a /tobeshipped/order/:id route and component.
                    <Link to={`/tobeshipped/order/${order._id}`}>View Shipment</Link>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyOrders;