import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users`,
        { name, email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const getAuthToken = () => {
    return user?.token;
  };

  // New function to update user state and localStorage (used for Google login)
  const setUserState = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, register, logout, getAuthToken, setUser: setUserState }}>
      {!loading && children}
    </UserContext.Provider>
  );
};
