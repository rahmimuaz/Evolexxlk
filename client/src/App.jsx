import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import ProductDetail from './pages/ProductDetails/ProductDetail';
import Cart from './pages/CartPage/Cart';
import Checkout from './pages/CheckOut/Checkout';
import OrderDetails from './components/OrderDetails/OrderDetails'; // Corrected component path based on your previous examples
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import Navbar from './components/Navbar/Navbar';
import CardPaymentPage from './pages/Payment/CardPaymentPage';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import Homepage from './pages/Home/Homepage';
import Footer from './components/Footer/Footer';
import CategoryPage from './pages/Category/CategoryPage';
import MyOrders from './pages/MyOrders'; // Import MyOrders
import ToBeShippedDetailScreen from './pages/ToBeShippedDetailScreen';

function App() {
  return (
    <Router>
      <UserProvider>
        <CartProvider>
          <div className="app">
            <Navbar />
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/product/:id" element={<ProductDetail />} /> {/* Duplicate route, consider removing one */}
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/card-payment" element={<CardPaymentPage />} />
                <Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/homepage" element={<Homepage />} /> {/* Duplicate route, consider removing */}
                <Route path="/footer" element={<Footer/>} /> {/* This usually isn't a separate route */}
                <Route path="/my-orders" element={<MyOrders />} /> {/* This is the correct addition! */}
                <Route path="/tobeshipped/order/:id" element={<ToBeShippedDetailScreen />} />
                
              </Routes>
            {/* Consider placing Footer here if it should appear on all pages */}
            {/* <Footer /> */}
          </div>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}

export default App;