import React from 'react';
import './Footer.css';

const Footer = () => {
  const handleContactClick = () => alert('Contact us section');
  const handleAddressClick = () => alert('Address section');
  const handleFaqClick = () => alert('FAQ section');
  const handleTermsClick = () => alert('Terms and Conditions');
  const handleHelpClick = () => alert('Help Center');
  const handleReturnsClick = () => alert('Returns & Refunds');
  const handleShippingClick = () => alert('Shipping & Delivery');
  const handleWarrantyClick = () => alert('Warranty Information');

  return (
    <div>
          <hr className="section-divider" />
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-text">EVOLEXX</span>
            </div>
            <p>Experience the future with our top-notch gadgets and devices.</p>
            <div className="social-icons">
            </div>
          </div>

          <div className="footer-links">
            <h4>About Us</h4>
            <ul>
              <li><button onClick={handleContactClick} className="footer-link-btn">Contact</button></li>
              <li><button onClick={handleAddressClick} className="footer-link-btn">Address</button></li>
              <li><button onClick={handleFaqClick} className="footer-link-btn">FAQ’s</button></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Customer Service</h4>
            <ul>
              <li><button onClick={handleTermsClick} className="footer-link-btn">Terms and Conditions</button></li>
              <li><button onClick={handleHelpClick} className="footer-link-btn">Help Center</button></li>
              <li><button onClick={handleReturnsClick} className="footer-link-btn">Returns & Refunds</button></li>
              <li><button onClick={handleShippingClick} className="footer-link-btn">Shipping & Delivery</button></li>
              <li><button onClick={handleWarrantyClick} className="footer-link-btn">Warranty Information</button></li>
            </ul>
          </div>
        </div>
      </footer>

      <hr className="footer-divider" />

      <div className="footer-bottom">
        <p>© 2025 Evolexx. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
