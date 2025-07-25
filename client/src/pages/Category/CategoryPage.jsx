// Updated CategoryPage.jsx matching Homepage layout, style, and functionality

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaSlidersH } from 'react-icons/fa';
import './CategoryPage.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PRODUCTS_PER_PAGE = 12;

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('');
  const headingRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/category/${encodeURIComponent(category)}`);
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          const prices = data.map(p => p.price || 0);
          setPriceRange([Math.min(...prices), Math.max(...prices)]);
        }
      } catch (err) {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  const generateImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      const image = product.images[0];
      if (image.startsWith('http')) return image;
      if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
      if (image.startsWith('uploads/')) return `${API_BASE_URL}/${image}`;
      return `${API_BASE_URL}/uploads/${image.replace(/^\//, '')}`;
    }
    return '/logo192.png';
  };

  const allBrands = Array.from(new Set(products.map(p => p.details?.brand).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    const price = product.price || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesBrand = !brandFilter || product.details?.brand === brandFilter;
    const matchesStock = !inStockOnly || (product.stock && product.stock > 0);
    return matchesPrice && matchesBrand && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sort === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      const direction = pageNumber > currentPage ? 'slide-left' : 'slide-right';
      setAnimationDirection(direction);
      setTimeout(() => {
        setCurrentPage(pageNumber);
        setAnimationDirection('');
        if (headingRef.current) {
          const topPos = headingRef.current.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: topPos - 80, behavior: 'smooth' });
        }
      }, 400);
    }
  };

  const handleBrandChange = (e) => {
    setBrandFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceChange = (e, idx) => {
    const val = Number(e.target.value);
    setPriceRange(pr => idx === 0 ? [val, pr[1]] : [pr[0], val]);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setCurrentPage(1);
  };

  const handleStockChange = (e) => {
    setInStockOnly(e.target.checked);
    setCurrentPage(1);
  };

  if (loading) return <div className="loader">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="product-section2">
      <div className="heading-with-icon">
        <h2 ref={headingRef}>{category}</h2>
        <FaSlidersH
          className="filter-toggle-icon"
          onClick={() => setShowFilters(!showFilters)}
          title="Filter & Sort"
        />
      </div>

      {showFilters && (
        <div className="filter-sort-bar">
          <div className="filter-group">
            <label>Sort:</label>
            <select value={sort} onChange={handleSortChange}>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group price-range-group">
            <label>Price:</label>
            <input type="number" value={priceRange[0]} onChange={e => handlePriceChange(e, 0)} className="price-input" />
            <span>-</span>
            <input type="number" value={priceRange[1]} onChange={e => handlePriceChange(e, 1)} className="price-input" />
          </div>

          {allBrands.length > 0 && (
            <div className="filter-group brand-filter-group">
              <label>Brand:</label>
              <select value={brandFilter} onChange={handleBrandChange} className="brand-select-dropdown">
                <option value="">All</option>
                {allBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>
              <input type="checkbox" checked={inStockOnly} onChange={handleStockChange} /> In Stock Only
            </label>
          </div>

          <button onClick={() => setShowFilters(false)} className="nav-info-button filter-done-button">Done</button>
        </div>
      )}

      <div className={`product-grid-container ${animationDirection}`}>
        <div className="product-grid">
          {currentProducts.map(product => {
            const imageUrl = generateImageUrl(product);
            const fullPrice = product.price || 0;
            const kokoTotal = fullPrice * 1.12;
            const kokoInstallment = kokoTotal / 3;
            return (
              <Link to={`/products/${product._id}`} className="product-card" key={product._id}>
                <img src={imageUrl} alt={product.name} onError={e => (e.target.src = '/logo192.png')} />
                <div className="product-card-content">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{product.rating >= star ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <div className="card-footer">
                    <p className="price">
                      Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                    {product.kokoPay && product.price && (
                      <p className="koko-pay">
                        or pay in 3 × Rs. {kokoInstallment.toLocaleString('en-LK', { minimumFractionDigits: 2 })} with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pagination-dots2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <div
            key={page}
            className={`dot ${page === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
            title={`Page ${page}`}
          ></div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default CategoryPage;