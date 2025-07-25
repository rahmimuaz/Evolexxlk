// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';
import Footer from '../../components/Footer/Footer';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';
import ReactMarkdown from 'react-markdown';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const { addToCart } = useCart();
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('Description');
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedReviewFilter, setSelectedReviewFilter] = useState('All ratings');

  // State for modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Base URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0]);
        }
      } catch (err) {
        setError('Error fetching product details.');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, API_BASE_URL]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0 && !mainImage) {
      setMainImage(product.images[0]);
    }
  }, [product, mainImage]);

  useEffect(() => {
    if (product) {
      axios
        .get(`${API_BASE_URL}/api/products/${id}/reviews`)
        .then((res) => {
          setReviews(res.data);
          setFilteredReviews(res.data); // Initialize filtered reviews with all reviews
        })
        .catch((err) => {
            console.error("Error fetching reviews:", err);
            setReviews([]);
            setFilteredReviews([]);
        });
    }
  }, [product, id, API_BASE_URL]);

  useEffect(() => {
    if (product && Array.isArray(product.details?.color) && product.details.color.length > 0) {
      setSelectedColor(product.details.color[0]);
    }
  }, [product]);

  // Handle review filtering based on selectedReviewFilter
  useEffect(() => {
    if (reviews.length > 0) {
      let tempReviews = [...reviews];
      if (selectedReviewFilter === 'All ratings') {
        setFilteredReviews(tempReviews);
      } else if (selectedReviewFilter.includes('positive')) {
        setFilteredReviews(tempReviews.filter(review => review.rating >= 4));
      } else if (selectedReviewFilter.includes('disappointed')) {
        setFilteredReviews(tempReviews.filter(review => review.rating <= 2));
      } else if (!isNaN(parseInt(selectedReviewFilter))) {
        const rating = parseInt(selectedReviewFilter);
        setFilteredReviews(tempReviews.filter(review => review.rating === rating));
      } else {
        setFilteredReviews(tempReviews);
      }
    } else {
      setFilteredReviews([]);
    }
  }, [reviews, selectedReviewFilter]);


  const handleQuantityChange = (type) => {
    setQuantity((prev) => {
      if (type === 'increment') return prev + 1;
      if (type === 'decrement' && prev > 1) return prev - 1;
      return prev;
    });
  };

  const handleAddToCart = () => {
    if (!user) { // Check if user is logged in
      setLoginModalOpen(true); // Open login modal if not logged in
      return;
    }
    if (product) {
      addToCart({ ...product, selectedColor }, quantity);
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    if (!user) { // Check if user is logged in
      setLoginModalOpen(true); // Open login modal if not logged in
      return;
    }
    if (product) {
      addToCart({ ...product, selectedColor }, quantity);
      navigate('/checkout');
    }
  };

  const handleThumbnailClick = (imagePath) => {
    setMainImage(imagePath);
  };

  const cleanImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`; // Default fallback
  };

  const currentMainImageUrl = cleanImagePath(mainImage);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      }, {
        headers: {
          Authorization: `Bearer ${user?.token}` // Include user token if available for authentication
        }
      });
      setReviewComment('');
      setReviewRating(5);
      // After successful submission, update reviews with the new populated review from the response
      setReviews(prevReviews => [...prevReviews, response.data.review]);
      setFilteredReviews(prevReviews => [...prevReviews, response.data.review]); // Also update filtered reviews
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review. Please ensure you are logged in.');
      console.error("Review submission error:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Count reviews by rating for the filters
  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  const positiveReviewsCount = reviews.filter(review => review.rating >= 4).length;
  const disappointedReviewsCount = reviews.filter(review => review.rating <= 2).length;


  if (loading)
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="not-found-message">Product not found.</div>;

  return (
    <div className="all">
      <div className="product-detail-page-container">
        <div className="product-detail-main-content">
          <div className="image-gallery-section">
            <div className="main-image-container">
              {currentMainImageUrl ? (
                <img
                  src={currentMainImageUrl}
                  alt={product.name}
                  className="main-image"
                  onError={(e) => (e.target.src = '/logo192.png')}
                />
              ) : (
                <div className="no-image-placeholder">No Image Available</div>
              )}
            </div>
            <div className="thumbnail-container">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={cleanImagePath(img)}
                  alt={`${product.name} ${i + 1}`}
                  className={`thumbnail-image ${mainImage === img ? 'selected' : ''}`}
                  onClick={() => handleThumbnailClick(img)}
                  onError={(e) => (e.target.src = '/logo192.png')}
                />
              ))}
            </div>
          </div>

          <div className="product-info-section">
            <h1 className="product-name-section">{product.name}</h1>
            <p className="product-tagline">{product.description}</p>

            <div className="product-ratings">
              {/* Display average rating stars */}
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5" fill={i < Math.floor(averageRating) ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-gray-600 text-sm">
                {reviews.length} Ratings
              </span>
            </div>
            <hr className="section-divider" />

            <div className="price-section">
              {product.discountPrice ? (
                <>
                  <span className="product-price" style={{ textDecoration: 'line-through', color: '#888', marginRight: 10, fontSize: '18px' }}>
                    Rs. {product.price?.toLocaleString() ?? 'N/A'}
                  </span>
                  <span className="product-price" style={{ color: '#e53935', fontWeight: 'bold' }}>
                    Rs. {product.discountPrice?.toLocaleString()}
                  </span>
                </>
              ) : (
                <p className="product-price">Rs. {product.price?.toLocaleString() ?? 'N/A'}</p>
              )}
              {product.kokoPay && product.price && (
                <p className="koko-pay">
                  or pay in 3 × Rs. {((product.price * 1.12) / 3).toLocaleString('en-LK', { minimumFractionDigits: 2 })} with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                </p>
              )}
            </div>

            <hr className="section-divider" />

            <div className="color-and-quantity-section">
              <div className="color-options-section">
                <p className="color-options-title">Color family</p>
                <div className="color-names">
                  {Array.isArray(product.details?.color) && product.details.color.length > 0 ? (
                    <>
                      <span>{product.details.color.join(', ')}</span>
                      {product.details.color.length > 1 && (
                        <div style={{ marginTop: 8 }}>
                          <label htmlFor="color-select">Select color: </label>
                          <select
                            id="color-select"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            style={{ marginLeft: 8 }}
                          >
                            {product.details.color.map((color, idx) => (
                              <option key={idx} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className='no'>No color options</span>
                  )}
                </div>
              </div>

              <div className="quantity-selector-section">
                <div className="stock-status-section">
                  {product.stock > 0 ? (
                    <span className="in-stock" style={{ color: 'green', fontWeight: 'bold' }}>In Stock</span>
                  ) : (
                    <span className="out-of-stock" style={{ color: 'red', fontWeight: 'bold' }}>Out of Stock</span>
                  )}
                </div>
                <div className="quantity-controls">
                  <button onClick={() => handleQuantityChange('decrement')} className="quantity-button">-</button>
                  <input type="text" value={quantity.toString().padStart(2, '0')} readOnly className="quantity-input" />
                  <button onClick={() => handleQuantityChange('increment')} className="quantity-button">+</button>
                </div>
                <span className="stock-info">Only {product.stock} left in stock</span>
              </div>

            </div>


            <div className="purchase-section">
              <div className="action-buttons-container">
                <button onClick={handleAddToCart} className="action-button add-to-cart-button" disabled={product.stock <= 0}>
                  ADD TO CART
                </button>
                <button onClick={handleBuyNow} className="action-button buy-now-button" disabled={product.stock <= 0}>
                  BUY NOW
                </button>
              </div>
            </div>
          </div>

          <div className="side-info-section">
            <div>
              <h2 className="info-block-title1">Delivery Options</h2>
              <div className="info-list">
                <div className="info-list-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Standard</p>
                    <p className="sub-text">Within 7 business days</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="info-block-title">Payment Options</h2>
              <div className="info-list">
                <div className="info-list-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                  </svg>


                  <div>
                    <p className="font-semibold">Bank Transfer</p>
                    <p className="sub-text">Secure and easy payment option</p>
                  </div>
                </div>

                <div className="info-list-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>

                  <div>
                    <p className="font-semibold">Cash on Delivery</p>
                    <p className="sub-text"> Pay at your doorstep</p>
                  </div>
                </div>

                <div className="info-list-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>

                  <div>
                    <p className="font-semibold">KOKO Payment</p>
                    <p className="sub-text">Pay in 3 instalments with debit card </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="info-block-title">Returns & Warranty Policy</h2>
              <div className="info-list">
                <div className="info-list-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <div>
                    <p className="font-semibold">7-day return & warranty.</p>
                    <p className="sub-text">Terms and conditions apply.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AliExpress style navigation tabs */}
        <div className="product-tabs-navigation">
          <div
            className={`tab-item ${activeTab === 'Description' ? 'active' : ''}`}
            onClick={() => setActiveTab('Description')}
          >
            Description
          </div>
          <div
            className={`tab-item ${activeTab === 'Specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('Specifications')}
          >
            Specifications
          </div>

          <div
            className={`tab-item ${activeTab === 'Customer Reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('Customer Reviews')}
          >
            Customer Reviews ({reviews.length})
          </div>
        </div>

        {/* Conditional rendering based on activeTab */}
        {activeTab === 'Description' && (
          <div className="product-description-section">
            <h2>Description</h2>
            {product.longDescription && (
              <ReactMarkdown>{product.longDescription}</ReactMarkdown>
            )}
          </div>
        )}

        {activeTab === 'Specifications' && (
          <div className="product-specifications-section">
            <h2>Specifications</h2>
            {product.details ? (
              <ul>
                {Object.entries(product.details).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'Customer Reviews' && (
          <div className="product-reviews-section">
            <h2>Reviews {averageRating} <span className="stars-in-reviews">
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < Math.floor(averageRating) ? '#FFD700' : '#ccc' }}>★</span>
              ))}
            </span> {reviews.length} ratings <span className="verified-purchases"> All from verified purchases</span></h2>

            {/* Review Filter Buttons */}
            <div className="review-filters">
              <button
                className={`filter-button ${selectedReviewFilter === 'All ratings' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('All ratings')}
              >
                All ratings ({reviews.length})
              </button>
              {ratingCounts[5] > 0 && <button
                className={`filter-button ${selectedReviewFilter === '5' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('5')}
              >
                (5) ({ratingCounts[5]})
              </button>}
              {ratingCounts[4] > 0 && <button
                className={`filter-button ${selectedReviewFilter === '4' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('4')}
              >
                (4) ({ratingCounts[4]})
              </button>}
              {ratingCounts[3] > 0 && <button
                className={`filter-button ${selectedReviewFilter === '3' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('3')}
              >
                (3) ({ratingCounts[3]})
              </button>}
              {ratingCounts[2] > 0 && <button
                className={`filter-button ${selectedReviewFilter === '2' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('2')}
              >
                (2) ({ratingCounts[2]})
              </button>}
              {ratingCounts[1] > 0 && <button
                className={`filter-button ${selectedReviewFilter === '1' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('1')}
              >
                (1) ({ratingCounts[1]})
              </button>}
              {positiveReviewsCount > 0 && <button
                className={`filter-button ${selectedReviewFilter === 'positive' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('positive')}
              >
                positive ({positiveReviewsCount})
              </button>}
              {disappointedReviewsCount > 0 && <button
                className={`filter-button ${selectedReviewFilter === 'disappointed' ? 'active' : ''}`}
                onClick={() => setSelectedReviewFilter('disappointed')}
              >
                disappointed ({disappointedReviewsCount})
              </button>}
              {/* You can add more specific filters as needed, e.g., 'beautiful shape' if you had tags in your review data */}
            </div>


            {filteredReviews.length === 0 && <p>No reviews yet for this filter.</p>}
            {filteredReviews.map((review, idx) => (
              <div key={idx} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-avatar">
                      {/* Replace with actual user avatar if available */}
                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                    </span>
                    <span className="reviewer-name">
                      {/* THIS IS THE UPDATED PART: Use review.user.name */}
                      {review.user ? review.user.name : `User ${review._id || idx + 1}`}
                    </span>
                  </div>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? '#FFD700' : '#ccc' }}>★</span>
                    ))}
                  </div>
                </div>
                {review.productColor && <div className="review-product-details">
                  Color: {review.productColor}
                </div>}
                <div className="review-comment">{review.comment}</div>
                {review.images && review.images.length > 0 && (
                  <div className="review-images">
                    {review.images.map((img, i) => (
                      <img
                        key={i}
                        src={cleanImagePath(img)}
                        alt={`Review ${i + 1}`}
                        className="review-thumbnail-image"
                      />
                    ))}
                  </div>
                )}
                <div className="review-meta">
                  <span className="review-date">{review.date ? new Date(review.date).toLocaleDateString() : ''}</span> {/* Use review.date */}
                  <button className="helpful-button">Helpful (0)</button> {/* Placeholder for helpful button */}
                </div>
              </div>
            ))}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="review-form">
                <h3>Write a Review</h3>
                <div className="review-form-rating">
                  <label>Rating: </label>
                  <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  required
                  rows={3}
                />
                <button type="submit" disabled={reviewSubmitting} className="submit-review-btn">
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {reviewError && <div className="review-error">{reviewError}</div>}
              </form>
            ) : (
              <p style={{ marginTop: 12 }}>Please log in to write a review.</p>
            )}
          </div>
        )}

        {activeTab === 'Store' && (
          <div className="product-store-section">
            <h2>Store Information</h2>
            <p>Details about the store selling this product would go here.</p>
            {/* You would typically fetch and display store-specific information */}
          </div>
        )}

        {activeTab === 'More to love' && (
          <div className="product-more-to-love-section">
            <h2>More Products You Might Love</h2>
            <p>Similar products or recommendations would be displayed here.</p>
            {/* Implement logic to fetch and display related products */}
          </div>
        )}

      </div>
      <Footer />

      {/* Login/Register Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          sourcePage="productDetail"
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
    </div>
  );
};

export default ProductDetail;