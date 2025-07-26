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
      if (!user) return;
      try {
        setLoading(true); // Set loading to true before fetching
        const [pendingOrdersRes, shippedOrdersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/orders/myorders`, { // Assuming this fetches user's pending orders
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, { // **NEW ENDPOINT for TobeShipped orders**
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);

        // Combine the results from both schemas
        const combinedOrders = [...pendingOrdersRes.data, ...shippedOrdersRes.data];

        // Sort orders by creation date (most recent first) for better display
        combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOrders(combinedOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
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
                <td>{order.orderNumber || order._id}</td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</td>
                <td>Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                <td>{order.status || order.paymentStatus || 'N/A'}</td>
                <td>
                  <Link to={`/order/${order._id}`}>View</Link>
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