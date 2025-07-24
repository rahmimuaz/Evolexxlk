import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import BankTransferModal from '../Payment/BankTransferModal';
import './Checkout.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const sriLankaCities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Negombo",
  "Batticaloa",
  "Trincomalee",
  "Matara",
  "Anuradhapura",
  "Ratnapura",
  "Badulla",
  "Kurunegala",
  "Hambantota",
  "Vavuniya",
  "Nuwara Eliya",
  // Add more cities here if needed
];

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cod'
  });

  const [cityInput, setCityInput] = useState(formData.city);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const cityRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferProofUrl, setBankTransferProofUrl] = useState(null);

  // Update form data fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Restrict phone input to digits only
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // only digits allowed
      setFormData(prev => ({ ...prev, phone: value }));
    }
  };

  // City input handler with autocomplete suggestions
  const handleCityChange = (e) => {
    const value = e.target.value;
    setCityInput(value);
    setFormData(prev => ({ ...prev, city: value }));

    if (value.length > 0) {
      const filteredCities = sriLankaCities.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setCitySuggestions(filteredCities);
    } else {
      setCitySuggestions([]);
    }
  };

  // When user selects city from suggestions
  const handleCitySelect = (city) => {
    setCityInput(city);
    setFormData(prev => ({ ...prev, city }));
    setCitySuggestions([]);
  };

  // Close city suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCitySuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Payment method change handler
  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    if (selectedMethod === 'card') return; // prevent card selection
    setFormData(prev => ({ ...prev, paymentMethod: selectedMethod }));
    if (selectedMethod !== 'bank_transfer') setBankTransferProofUrl(null);
  };

  // Validation before submitting
  const validateForm = () => {
  const { fullName, email, address, city, postalCode, phone } = formData;

  if (!fullName.trim()) {
    toast.error('Full name is required');
    return false;
  }
  if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
    toast.error('Valid email is required');
    return false;
  }
  if (!phone.trim() || phone.length < 7) {
    toast.error('Valid phone number is required');
    return false;
  }
  if (!city.trim()) {
    toast.error('City is required');
    return false;
  }
  if (!address.trim()) {
    toast.error('Address is required');
    return false;
  }
  if (!postalCode.trim()) {
    toast.error('Postal code is required');
    return false;
  }
  return true;
};


  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }
    if (formData.paymentMethod === 'bank_transfer') {
      setShowBankTransferModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await placeOrder();
    } finally {
      setIsLoading(false);
    }
  };

  // Place order API call
  const placeOrder = async (proofUrl = null) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const shippingAddress = {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone
      };

      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const total = cartItems.reduce(
        (acc, item) => acc + (item.product ? item.product.price * item.quantity : 0),
        0
      );

      const orderData = {
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        bankTransferProof: proofUrl || bankTransferProofUrl,
        orderItems,
        totalPrice: total
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/orders`,
        orderData,
        config
      );

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${data._id}`);
    } catch (error) {
      console.error('Order creation error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  // Handle bank transfer modal submission
  const handleBankTransferSubmit = (fileUrl) => {
    setBankTransferProofUrl(fileUrl);
    setShowBankTransferModal(false);
    toast.info('Bank transfer proof attached. Proceeding to place order.');
    placeOrder(fileUrl);
  };

  // Image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  // Handle product image load error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product ? item.product.price * item.quantity : 0),
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="checkout-page-container">
      <div className="checkout-max-width-wrapper">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-grid">
          <div className="shipping-info-section">
            <div className="checkout-card">
              <h2 className="section-heading">Shipping Information</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Render fields except city */}
                  {['fullName', 'email', 'phone', 'address', 'postalCode'].map((field) => (
                    <div className="form-group" key={field}>
                      <label htmlFor={field} className="form-label">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={field === 'phone' ? handlePhoneChange : handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  ))}

                  {/* City input with autocomplete */}
                  <div className="form-group" ref={cityRef} style={{ position: 'relative' }}>
                    <label htmlFor="city" className="form-label">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={cityInput}
                      onChange={handleCityChange}
                      className="form-input"
                      autoComplete="off"
                      required
                    />
                    {citySuggestions.length > 0 && (
                      <ul className="autocomplete-suggestions">
                        {citySuggestions.map((city) => (
                          <li
                            key={city}
                            onClick={() => handleCitySelect(city)}
                            className="autocomplete-suggestion"
                          >
                            {city}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="payment-method-section">
                  <h2 className="section-heading">Payment Method</h2>
                  <div className="payment-options-group">
                    {[
                      { id: 'cod', label: 'Cash on Delivery' },
                      { id: 'card', label: 'Card Payment', disabled: true },
                      { id: 'bank_transfer', label: 'Bank Transfer' }
                    ].map((method) => (
                      <div className="radio-option" key={method.id}>
                        <input
                          type="radio"
                          id={method.id}
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handlePaymentMethodChange}
                          className="radio-input"
                          disabled={method.disabled}
                        />
                        <label htmlFor={method.id} className={`radio-label ${method.disabled ? 'disabled-label' : ''}`}>
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="place-order-button-container">
                  <button
                    type="submit"
                    className="place-order-button"
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="spinner-button" /> : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="checkout-card">
              <h2 className="section-heading">Order Summary</h2>
              <div className="summary-items-list">
                {cartItems.map((item) => (
                  <div key={item._id} className="summary-item">
                    <div className="summary-item-content">
                      <div className="summary-item-image-container">
                        {item.product.images?.length > 0 ? (
                          <>
                            <img
                              src={getImageUrl(item.product.images[0])}
                              alt={item.product.name}
                              className="summary-item-image"
                              onError={handleImageError}
                            />
                            <div className="summary-item-image-placeholder" style={{ display: 'none' }} />
                          </>
                        ) : (
                          <div className="summary-item-image-placeholder" />
                        )}
                      </div>
                      <div className="summary-item-details">
                        <p className="summary-item-name">{item.product.name}</p>
                        <p className="summary-item-quantity">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="summary-item-price">
                      Rs. {(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-line">
                  <p className="summary-label">Subtotal</p>
                  <p className="summary-value">Rs. {subtotal.toLocaleString()}</p>
                </div>
                <div className="summary-line">
                  <p className="summary-label">Shipping</p>
                  <p className="summary-value">Free</p>
                </div>
                <div className="summary-line total-line">
                  <p>Total</p>
                  <p>Rs. {total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {showBankTransferModal && (
        <BankTransferModal
          onClose={() => setShowBankTransferModal(false)}
          onSubmit={handleBankTransferSubmit}
        />
      )}
    </div>
  );
};

export default Checkout;
