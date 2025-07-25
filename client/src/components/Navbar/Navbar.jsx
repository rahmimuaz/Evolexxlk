import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';
import {
  FaBars,
  FaShoppingCart,
  FaUserCircle,
  FaSearch,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaCog
} from 'react-icons/fa';
import Modal from '../Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const dropdownRef = useRef(null);
  const menuRef = useRef(null); // NEW

  // 🔁 Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔁 Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [menuOpen]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/products/search?query=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearchError(null);
        })
        .catch(() => setSearchError('Error fetching results'))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, API_BASE_URL]);

  const handleSearchSelect = (productId) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/products/${productId}`);
  };

  return (
    <nav className="navbar">
      {mobileSearchOpen && (
        <div className="mobile-search-overlay">
          <div className="search-input-wrapper-inner">
            <span className="search-input-icon"><FaSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search.."
              className="mobile-search-input"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              className="mobile-search-cancel"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setSearchError(null);
              }}
            >
              Cancel
            </button>
          </div>
          {(searchLoading || searchResults.length > 0 || searchError) && searchQuery && (
            <div className="search-suggestions-dropdown mobile">
              {searchLoading && <div className="search-suggestion-loading">Searching...</div>}
              {searchError && <div className="search-suggestion-error">{searchError}</div>}
              {!searchLoading && !searchError && searchResults.length === 0 && (
                <div className="search-suggestion-empty">No products found</div>
              )}
              {searchResults.map(product => (
                <div
                  className="search-suggestion-item"
                  key={product._id}
                  onClick={() => handleSearchSelect(product._id)}
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="search-suggestion-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
                  />
                  <div className="search-suggestion-info">
                    <div className="search-suggestion-name">{product.name}</div>
                    <div className="search-suggestion-price">
                      Rs. {product.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="navbar-container" style={{ display: mobileSearchOpen ? 'none' : undefined }}>
        <button className="hamburger-button" onClick={toggleMenu} aria-label="Toggle menu">
          <FaBars />
        </button>

        <div className="navbar-left">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        {/* ✅ Mobile dropdown with ref */}
        <div
          ref={menuRef}
          className={`navbar-center ${menuOpen ? 'open' : ''} ${searchOpen ? 'shifted-left' : ''}`}
        >
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/category/Mobile%20Phone" className={`navbar-link ${location.pathname === '/category/Mobile%20Phone' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Brand New</Link>
            <Link to="/category/Preowned%20Phones" className={`navbar-link ${location.pathname === '/category/Preowned%20Phones' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Pre Owned</Link>
            <Link to="/category/Mobile%20Accessories" className={`navbar-link ${location.pathname === '/category/Mobile%20Accessories' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Accessories</Link>
          </div>
        </div>

        <div className="navbar-divider" />

        <div className="navbar-right">
          {window.innerWidth > 768 ? (
            !searchOpen ? (
              <button
                className="search-icon-button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <FaSearch size={18} />
              </button>
            ) : (
              <div className={`search-bar-integrated ${searchOpen ? 'visible' : ''}`}>
                <div className="search-input-wrapper-inner">
                  <span className="search-input-icon"><FaSearch size={18} /></span>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="search-input-navbar"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="search-bar-close"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                    type="button"
                  >
                    &times;
                  </button>
                </div>
                {(searchLoading || searchResults.length > 0 || searchError) && searchQuery && (
                  <div className="search-suggestions-dropdown">
                    {searchLoading && <div className="search-suggestion-loading">Searching...</div>}
                    {searchError && <div className="search-suggestion-error">{searchError}</div>}
                    {!searchLoading && !searchError && searchResults.length === 0 && (
                      <div className="search-suggestion-empty">No products found</div>
                    )}
                    {searchResults.map(product => (
                      <div
                        className="search-suggestion-item"
                        key={product._id}
                        onClick={() => handleSearchSelect(product._id)}
                      >
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="search-suggestion-img"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
                        />
                        <div className="search-suggestion-info">
                          <div className="search-suggestion-name">{product.name}</div>
                          <div className="search-suggestion-price">
                            Rs. {product.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <button
              className="search-icon-button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <FaSearch size={18} />
            </button>
          )}

          {user && (
            <Link to="/cart" className="cart-button">
              <FaShoppingCart size={18} />
              <span className="cart-count">{cartItems.length}</span>
            </Link>
          )}

          {/* Profile dropdown */}
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button className="profile-icon-button" onClick={toggleDropdown} aria-label="Toggle profile menu">
              <FaUserCircle size={22} />
            </button>
            <div className={`dropdown-menu ${dropdownOpen ? 'show-dropdown' : ''}`}>
              {user ? (
                <>
                  <span className="dropdown-text-1">Signed in as <span className="user-name-dropdown-text">{user.name}</span></span>
                  <Link to="/settings" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaCog className="dropdown-icon" />
                    Settings
                  </Link>
                  <Link to="/my-orders" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaShoppingCart className="dropdown-icon" />
                    My Orders
                  </Link>
                  <button className="logout-dropdown-button" onClick={logout}>
                    <FaSignOutAlt className="dropdown-icon" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <span className="dropdown-text">Welcome</span>
                  <button className="dropdown-link" onClick={() => { setLoginModalOpen(true); setDropdownOpen(false); }}>
                    <FaSignInAlt className="dropdown-icon" />
                    Login
                  </button>
                  <button className="dropdown-link" onClick={() => { setRegisterModalOpen(true); setDropdownOpen(false); }}>
                    <FaUserPlus className="dropdown-icon" />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          onSuccess={() => setLoginModalOpen(false)}
          onSwitchRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
        />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register
          asModal
          onSuccess={() => setRegisterModalOpen(false)}
          onSwitchLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>
    </nav>
  );
};

export default Navbar;
