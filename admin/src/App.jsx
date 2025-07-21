import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import AddProduct from './pages/Inventory/AddProduct';
import EditProduct from './pages/Inventory/EditProduct';
import Products from './pages/Inventory/Products';
import OrderList from './pages/OrderManagement/OrderList';
import ToBeShippedList from './pages/OrderManagement/ToBeShippedList';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import LoginForm from './pages/AdminLogin/LoginForm';
import RegisterForm from './pages/AdminLogin/RegisterForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import LowStockProducts from './pages/Inventory/LowStockProducts';
import OutOfStockProducts from './pages/Inventory/OutOfStockProducts';
import UserList from './pages/AdminDashboard/UserList';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <Navbar>
          <main className="main-content">
            <div className="max-width-container">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/AddProduct" element={<AddProduct />} />
                <Route path="/EditProduct/:id" element={<EditProduct />} />
                <Route path="/Products" element={<Products />} />
                <Route path="/OrderList" element={<OrderList />} />
                <Route path="/ToBeShippedList" element={<ToBeShippedList />} />
                <Route path="/admin/low-stock" element={<LowStockProducts />} />
                <Route path="/admin/out-of-stock" element={<OutOfStockProducts />} />
                <Route path="/admin/users" element={<UserList />} />
                <Route path="*" element={<AdminDashboard />} />
              </Routes>
            </div>
          </main>
        </Navbar>
      ) : (
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;