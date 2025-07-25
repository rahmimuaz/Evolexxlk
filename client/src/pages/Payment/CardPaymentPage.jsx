import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CardPaymentPage.css';

const CardPaymentPage = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const [savedCards] = useState([
    { id: '1', last4: '1234', brand: 'Visa', expiry: '12/25' },
    { id: '2', last4: '5678', brand: 'MasterCard', expiry: '07/26' },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
      toast.error('Please fill in all fields');
      return;
    }

    toast.info('Processing payment...');

    try {
      // Example API call to process payment - replace with your real endpoint & logic
      /*
      const response = await fetch(`${API_BASE_URL}/api/payments/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, expiryDate, cvv, cardHolderName, saveCard }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }
      */

      // Simulated delay for demo purposes
      setTimeout(() => {
        toast.success('Payment successful!');
        navigate('/checkout');
      }, 2000);

    } catch (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  const selectSavedCard = (card) => {
    toast.info(`Selected saved card ending in ${card.last4}`);
    navigate('/checkout');
  };

  return (
    <div className="card-payment-page-container">
      <div className="payment-card">
        <h1 className="main-title">Card Payment</h1>

        {savedCards.length > 0 && (
          <div className="saved-cards-section">
            <h2 className="section-title">Your Saved Cards</h2>
            <div className="saved-cards-grid">
              {savedCards.map(card => (
                <div
                  key={card.id}
                  className="saved-card-item"
                  onClick={() => selectSavedCard(card)}
                >
                  <div>
                    <p className="saved-card-brand-last4">{card.brand} **** {card.last4}</p>
                    <p className="saved-card-expiry">Expires: {card.expiry}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="saved-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="section-title">Enter New Card Details</h2>
        <form onSubmit={handleSubmit} className="new-card-form">
          <div className="form-field">
            <label htmlFor="cardNumber" className="form-label">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
              maxLength="19"
              placeholder="XXXX XXXX XXXX XXXX"
              className="form-input"
              required
            />
          </div>

          <div className="grid-cols-2-gap-6">
            <div className="form-field">
              <label htmlFor="expiryDate" className="form-label">Expiry Date (MM/YY)</label>
              <input
                type="text"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, '').replace(/^(\d{2})/, '$1/').substring(0, 5))}
                maxLength="5"
                placeholder="MM/YY"
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="cvv" className="form-label">CVV</label>
              <input
                type="text"
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                maxLength="4"
                placeholder="XXX"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cardHolderName" className="form-label">Cardholder Name</label>
            <input
              type="text"
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder="Full name on card"
              className="form-input"
              required
            />
          </div>

          <div className="checkbox-container">
            <input
              id="saveCard"
              name="saveCard"
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="saveCard" className="checkbox-label">
              Save this card for future payments
            </label>
          </div>

          <button
            type="submit"
            className="pay-now-button"
          >
            Pay Now
          </button>
        </form>

        <button
          onClick={() => navigate('/checkout')}
          className="back-to-checkout-button"
        >
          Back to Checkout
        </button>
      </div>
    </div>
  );
};

export default CardPaymentPage;
