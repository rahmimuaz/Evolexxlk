import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); 
  
  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Check if token exists and is valid on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        try {
          // Verify token with backend using the environment variable
          const response = await fetch(`${API_BASE_URL}/api/admin/verify-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log('AuthContext: Token validated successfully');
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            setToken(null);
            setIsAuthenticated(false);
            console.log('AuthContext: Invalid token, removed from storage');
          }
        } catch (error) {
          console.error('AuthContext: Error validating token:', error);
          localStorage.removeItem('authToken');
          setToken(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, [API_BASE_URL]); // Add API_BASE_URL to the dependency array
  
  useEffect(() => {
    console.log('AuthContext: Token changed to:', token);
    setIsAuthenticated(!!token); 
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('AuthContext: Token saved to localStorage');
    } else {
      localStorage.removeItem('authToken'); 
      console.log('AuthContext: Token removed from localStorage');
    }
  }, [token]); 

  const login = (newToken) => {
    console.log('AuthContext: Login called with token:', newToken);
    setToken(newToken); 
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    setToken(null); 
    navigate('/login'); 
  };

  const contextValue = {
    token, 
    isAuthenticated, 
    isLoading,
    login, 
    logout,
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};