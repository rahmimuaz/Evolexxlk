import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (id, type) => {
    const item = cartItems.find(i => i._id === id);
    if (!item) return;

    if (type === 'increment') {
      updateQuantity(item.product._id, item.quantity + 1);
    } else if (type === 'decrement' && item.quantity > 1) {
      updateQuantity(item.product._id, item.quantity - 1);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/')
      ? `${API_BASE_URL}${path}`
      : `${API_BASE_URL}/${path}`;
  };

  const onImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const anyOutOfStock = cartItems.some(item => item.product?.stock <= 0);

  return (
    <div className="cart">
      <h1 className="cart-title">Cart</h1>
      <main className="cart-content max-width">
        <div className="cart-items-wrapper">
          <section className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-message">Your cart is empty.</p>
            ) : (
              cartItems.map(item => (
                <article className="cart-item" key={item._id}>
                  <div className="image-wrapper">
                    {item.product?.images?.length ? (
                      <>
                        <img
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          onError={onImageError}
                          className="product-image"
                        />
                        <div className="image-placeholder" style={{ display: 'none' }}>
                          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="image-placeholder">
                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="details">
                    <h2 className="product-name">{item.product?.name || 'N/A'}</h2>
                    <p className="product-desc">{item.product?.description || 'N/A'}</p>
                    {item.selectedColor && (
                      <p className="product-color">Color: {item.selectedColor}</p>
                    )}
                    {item.product?.stock <= 0 && (
                      <p className="cart-out-of-stock" style={{ color: 'red', fontWeight: 'bold' }}>
                        Out of Stock
                      </p>
                    )}

                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item._id, 'decrement')}
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >-</button>
                      <span className="qty-display">{String(item.quantity).padStart(2, '0')}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, 'increment')}
                        className="qty-btn"
                        aria-label="Increase quantity"
                      >+</button>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="remove-btn"
                      >Remove</button>
                    </div>
                  </div>

                  <div className="item-price">
                    Rs. {(item.product?.price * item.quantity).toLocaleString() || 'N/A'}
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        <aside className="cart-summary">
          <h2 className="summary-title">Add a Note</h2>
          <p className="note-instruction">Write something here for the seller</p>

          <div className="summary-details">
            <div className="summary-row">
              <span>Discount</span>
              <span>Rs. 0</span>
            </div>
            <div className="summary-row subtotal">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <p className="taxes-note">Taxes and shipping free</p>

          <button
            className="checkout-btn"
            onClick={() => navigate('/checkout')}
            disabled={anyOutOfStock}
          >
            Check Out
          </button>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
