import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import BankTransferModal from '../Payment/BankTransferModal';
import './Checkout.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

  const [isLoading, setIsLoading] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferProofUrl, setBankTransferProofUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    setFormData(prev => ({ ...prev, paymentMethod: selectedMethod }));
    if (selectedMethod === 'card') navigate('/card-payment');
    if (selectedMethod !== 'bank_transfer') setBankTransferProofUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const handleBankTransferSubmit = (fileUrl) => {
    setBankTransferProofUrl(fileUrl);
    setShowBankTransferModal(false);
    toast.info('Bank transfer proof attached. Proceeding to place order.');
    placeOrder(fileUrl);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

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
                  {['fullName', 'email', 'phone', 'city', 'address', 'postalCode'].map((field) => (
                    <div className="form-group" key={field}>
                      <label htmlFor={field} className="form-label">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="payment-method-section">
                  <h2 className="section-heading">Payment Method</h2>
                  <div className="payment-options-group">
                    {[
                      { id: 'cod', label: 'Cash on Delivery' },
                      { id: 'card', label: 'Card Payment' },
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
                        />
                        <label htmlFor={method.id} className="radio-label">
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
