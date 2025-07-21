import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Login.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = ({ asModal = false, onSuccess, onSwitchRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (error) {
      alert(error?.response?.data?.message || 'Login failed');
    }
  };

  const clientId = '235074436580-tqrft13a5lddfr16sq1qth0quficpu5k.apps.googleusercontent.com';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/users/google-login`, {
        token: credentialResponse.credential,
      });

      localStorage.setItem('userInfo', JSON.stringify(res.data));
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err) {
      alert(err?.response?.data?.message || 'Google login failed');
    }
  };

  const LoginForm = () => (
    <>
      <h2 className="login-title">Login</h2>
      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group password">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            className="form-input password-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
      <div style={{ margin: '16px 0' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => alert('Google Login Failed')}
        />
      </div>
    </>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {asModal ? (
        <div>
          {LoginForm()}
          <p className="register-text">
            New Customer?{' '}
            <button
              type="button"
              className="register-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={onSwitchRegister}
            >
              Register
            </button>
          </p>
        </div>
      ) : (
        <div className="login-page-container">
          <div className="login-card">
            {LoginForm()}
            <p className="register-text">
              New Customer? <Link to="/register" className="register-link">Register</Link>
            </p>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

export default Login;
