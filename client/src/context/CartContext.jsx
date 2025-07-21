import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from './UserContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) {
        setCartItems([]);
        return;
      }

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get(`${API_BASE_URL}/api/users/cart`, config);
        setCartItems(data);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        toast.error(error.response?.data?.message || 'Failed to load cart.');
      }
    };

    fetchCartItems();
  }, [user]);

  const addToCart = async (product, quantity) => {
    if (!user) {
      toast.error('Please log in to add items to cart.');
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users/cart`,
        { productId: product._id, quantity },
        config
      );
      setCartItems(data);
      toast.success(`${quantity} of ${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) {
      toast.error('Please log in to remove items from cart.');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.delete(`${API_BASE_URL}/api/users/cart/${productId}`, config);
      setCartItems(data);
      toast.success('Item removed from cart.');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error(error.response?.data?.message || 'Failed to remove item from cart.');
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (!user) {
      toast.error('Please log in to update cart.');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/cart`,
        { productId, quantity: newQuantity },
        config
      );
      setCartItems(data);
      toast.success('Cart quantity updated.');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error.response?.data?.message || 'Failed to update quantity.');
    }
  };

  const clearCart = async () => {
    if (!user) {
      toast.error('Please log in to clear cart.');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.delete(`${API_BASE_URL}/api/users/cart`, config);
      setCartItems([]);
      toast.success('Cart cleared successfully.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error(error.response?.data?.message || 'Failed to clear cart.');
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
