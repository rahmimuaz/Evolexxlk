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
        const res = await axios.get(`${API_BASE_URL}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch orders.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) return <div style={{ padding: 32 }}>Please log in to view your orders.</div>;
  if (loading) return <div style={{ padding: 32 }}>Loading your orders...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 24 }}>My Orders</h2>
      {orders.length === 0 ? (
        <div>No orders found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Order #</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Total</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>{order.orderNumber || order._id}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>{order.status || order.paymentStatus || 'N/A'}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
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