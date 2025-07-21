import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';
import axios from 'axios';

const Navbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    // Fetch alerts: low stock, out of stock, new orders
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // Use API_BASE_URL for all axios requests
        const [lowStockRes, outOfStockRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products/admin/low-stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/products/admin/out-of-stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const lowStock = lowStockRes.data.map(p => ({ type: 'low', msg: `Low stock: ${p.name} (${p.stock})`, link: `/EditProduct/${p._id}` }));
        const outOfStock = outOfStockRes.data.map(p => ({ type: 'out', msg: `Out of stock: ${p.name}`, link: `/EditProduct/${p._id}` }));
        // New orders: show only those with status 'pending'
        const newOrders = ordersRes.data.filter(o => o.status === 'pending').map(o => ({ type: 'order', msg: `New order: #${o.orderNumber}`, link: `/orders/${o._id}` }));
        const allAlerts = [...lowStock, ...outOfStock, ...newOrders];
        setAlerts(allAlerts);
        setUnreadCount(allAlerts.length);
      } catch (err) {
        setAlerts([]);
        setUnreadCount(0);
        console.error("Error fetching alerts:", err); // Log error for debugging
      }
    };
    fetchAlerts();
  }, [API_BASE_URL]); // Add API_BASE_URL to dependency array

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleRegisterAdmin = () => {
    navigate('/register');
    setIsOpen(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0); // Mark as read when opened
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    if (link) navigate(link);
  };

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="navbar-inner-container">
          <div className="navbar-logo-wrapper">
            <NavLink to="/" className="navbar-logo">
              Admin Portal
            </NavLink>
          </div>

          <div className="navbar-links-desktop">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/Products"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/OrderList"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/ToBeShippedList"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Shipments
            </NavLink>
            <button
              onClick={handleRegisterAdmin}
              className="navbar-register-button"
            >
              Register Admin
            </button>
            <button
              onClick={handleLogout}
              className="navbar-logout-button"
            >
              Sign Out
            </button>
          </div>

          {/* Notification Icon - moved after links */}
          <div className="navbar-notification-wrapper">
            <button className="navbar-notification-btn" onClick={toggleNotifications}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <h4>Notifications</h4>
                {alerts.length === 0 ? (
                  <div className="notification-empty">No alerts</div>
                ) : (
                  <ul>
                    {alerts.map((alert, idx) => (
                      <li key={idx} className={`notification-item notification-${alert.type}`}
                          style={{ cursor: alert.link ? 'pointer' : 'default' }}
                          onClick={() => handleNotificationClick(alert.link)}>{alert.msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="navbar-mobile-menu-button-wrapper">
            <button
              onClick={toggleMenu}
              className="navbar-mobile-menu-button"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`navbar-mobile-menu ${isOpen ? 'open' : ''}`} id="mobile-menu">
          <div className="navbar-mobile-menu-links">
            <NavLink
              to="/"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/Products"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/OrderList"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/ToBeShippedList"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Shipments
            </NavLink>
            <button
              onClick={handleRegisterAdmin}
              className="navbar-mobile-register-button"
            >
              Register Admin
            </button>
            <button
              onClick={handleLogout}
              className="navbar-mobile-logout-button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
};

export default Navbar;