import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LowStockProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    // Use the API_BASE_URL here
    axios.get(`${API_BASE_URL}/api/products/admin/low-stock`)
      .then(res => setProducts(res.data))
      .catch((error) => { // Added error parameter for better logging
        console.error("Error fetching low stock products:", error); // Log the error
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [API_BASE_URL]); // Add API_BASE_URL to dependency array

  return (
    <div className="products-container">
      <h1 className="products-title">Low Stock Products</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</button>
      {loading ? <p>Loading...</p> : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="3">No low stock products found.</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.stock}</td>
                  <td>
                    <button onClick={() => navigate(`/EditProduct/${product._id}`)}>Edit</button> {/* Corrected path based on previous examples */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LowStockProducts;