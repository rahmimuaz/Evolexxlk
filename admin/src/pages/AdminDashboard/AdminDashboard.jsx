import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    // Fetch orders and group by date
    const fetchOrderStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        // Use the API_BASE_URL here
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const orders = await res.json();
        // Group orders by date (YYYY-MM-DD)
        const dateMap = {};
        orders.forEach(order => {
          // Use 'en-CA' or another locale that formats dates as YYYY-MM-DD for consistent keys
          // Or explicitly format:
          const orderDate = new Date(order.createdAt);
          const date = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
          dateMap[date] = (dateMap[date] || 0) + 1;
        });

        // Sort labels to ensure chronological order on the chart
        const labels = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const data = labels.map(date => dateMap[date]);
        setOrderStats({ labels, data });
      } catch (err) {
        console.error("Failed to fetch order statistics:", err); // Log the error
        setOrderStats({ labels: [], data: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchOrderStats();
  }, [API_BASE_URL]); // Add API_BASE_URL to the dependency array

  return (
    <div className="admin-dashboard-layout">
      <aside className="admin-sidebar">
        <ul className="sidebar-links">
          <li onClick={() => navigate('/AddProduct')}>Add Product</li>
          <li onClick={() => navigate('/Products')}>View All Products</li>
          <li onClick={() => navigate('/OrderList')}>View Orders</li>
          <li onClick={() => navigate('/ToBeShippedList')}>View Shipments</li>
          <li onClick={() => navigate('/admin/low-stock')}>Low Stock Products</li>
          <li onClick={() => navigate('/admin/out-of-stock')}>Out of Stock Products</li>
          <li onClick={() => navigate('/admin/users')}>View All Users</li>
        </ul>
      </aside>
      <main className="admin-dashboard-main">
        <h1 className="dashboard-title">Welcome to the Admin Dashboard</h1>
        <p className="dashboard-description">
          Here you can get a quick overview of your inventory, orders, and shipments.
        </p>
        <div className="dashboard-graph-placeholder">
          {loading ? (
            <span>Loading order graph...</span>
          ) : orderStats.labels.length === 0 ? (
            <span>No order data available</span>
          ) : (
            <Bar
              data={{
                labels: orderStats.labels,
                datasets: [
                  {
                    label: 'New Orders',
                    data: orderStats.data,
                    backgroundColor: '#3b82f6',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: { title: { display: true, text: 'Date' } },
                  y: { title: { display: true, text: 'Orders' }, beginAtZero: true },
                },
              }}
              height={80} // Adjust height as needed
            />
          )}
        </div>
        <div className="dashboard-cards-grid">
          {/* Existing cards can be kept or moved as needed */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;