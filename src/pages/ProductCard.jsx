import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  /**
   * Format the price with Vietnamese currency format
   * @param {number} price - The price to format
   * @returns {string} Formatted price string
   */
  const formatPrice = (price) => {
    // Return '0 ₫' if price is undefined, null, or not a number
    if (!price || isNaN(price)) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(price));
  };

  return (
    <div className="border rounded shadow-lg p-4 flex flex-col">
      <img src={product?.image || '/placeholder-image.jpg'} alt={product?.ProductName || 'Product Image'} className="h-40 object-contain mb-4" />
      <h2 className="text-xl font-semibold mb-2">{product?.ProductName || 'Unnamed Product'}</h2>
      <p className="text-gray-700 flex-grow mb-4">
        {product?.Description ? product.Description.substring(0, 100) + '...' : 'No description available.'}
      </p>
      <div className="mt-auto flex justify-between items-center">
        <span className="text-blue-500 font-bold text-lg">{formatPrice(product?.Price)}</span>
        <Link to={`/product/${product?.id || '#'}`} className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600">
          View
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
