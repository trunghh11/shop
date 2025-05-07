// import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import PropTypes from 'prop-types';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { auth } from '../firebase/config';

/**
 * ProductCard Component
 * 
 * Displays a single product with animations, interactive elements, and
 * responsive design. Handles user interactions like viewing details.
 * 
 * Features:
 * - Animated appearance and hover effects
 * - Discount and new product badges
 * - Price formatting with original price display
 * - Stock status indicator
 * 
 * @param {Object} product - The product data to display
 */
function ProductCard({ 
  product, 
  onAddToCart = () => {
    console.warn('onAddToCart handler is not provided to ProductCard component');
  }
}) {
  // const [user] = useAuthState(auth);
  const navigate = useNavigate();
  // const [showModal, setShowModal] = useState(false);
  // const [modalConfig, setModalConfig] = useState({
  //   type: 'success',
  //   message: ''
  // });

  // Intersection observer for revealing animation when card scrolls into view
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  /**
   * Navigate to product details page
   * Prevents event propagation when used in button
   */
  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  /**
   * Format price with Vietnamese currency format
   * @param {number} price - The price to format
   * @returns {string} The formatted price
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

  /**
   * Calculate discount percentage between original and current price
   * 
   * @param {number} originalPrice - The original price
   * @param {number} currentPrice - The current price
   * @returns {number} The discount percentage (rounded to nearest integer)
   */
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || !currentPrice || isNaN(originalPrice) || isNaN(currentPrice)) {
      return 0;
    }
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Card animation variants for entrance and hover effects
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -10,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Badge animation variants for pop-in effect
  const badgeVariants = {
    initial: { scale: 0 },
    animate: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    }
  };

  return (
    <>
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        whileHover="hover"
        className="
          relative
          bg-white
          rounded-2xl
          overflow-hidden
          transform
          transition-all
          duration-300
          hover:shadow-2xl
          group
          border
          border-gray-100
          flex
          flex-col
          h-full
          cursor-pointer
        "
        onClick={handleViewDetails}
      >
        {/* Product Badges - New Arrival and Discount */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product?.isNew && (
            <motion.div
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
            >
              New Arrival
            </motion.div>
          )}
          {(product?.OriginalPrice > product?.Price) && (
            <motion.div
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
            >
              {calculateDiscount(product?.OriginalPrice, product?.Price)}% OFF
            </motion.div>
          )}
        </div>

        {/* Product Image with View Details Overlay */}
        <div className="relative h-[240px] overflow-hidden bg-gray-50">
          <motion.img
            src={product?.image || '/placeholder-image.jpg'}
            alt={product?.ProductName || 'Product Image'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Overlay that appears on hover */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
            <motion.div
              className="bg-white text-blue-600 px-6 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: {
                  delay: 0.1,
                  duration: 0.2
                }
              }}
            >
              <Eye size={18} />
              <span>View Details</span>
            </motion.div>
          </div>
        </div>

        {/* Product Information Section */}
        <div className="flex flex-col flex-grow p-6">
          {/* Product Title, Description & Category */}
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
              {product?.ProductName || 'Product Name'}
            </h3>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {product?.Description || 'No description available'}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              {product?.Type && <span className="inline-block">{product?.Type}</span>}
            </div>
          </div>

          {/* Bottom Section - Price, Stock Status and Action Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Price and Stock Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product?.Price)}
                </span>
                {product?.OriginalPrice > product?.Price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product?.OriginalPrice)}
                  </span>
                )}
              </div>
              <span className={`
                text-s font-medium px-2.5 py-1 rounded-full
                ${product?.Stock > 0 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'}
              `}>
                {product?.Stock > 0 ? `Còn: ${product.Stock}` : 'Hết hàng'}
              </span>
            </div>

            {/* Action Buttons - View Product */}
            <div className="flex gap-3">
              {/* View Product Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewDetails}
                className={`
                  flex-grow
                  h-12
                  rounded-lg
                  font-semibold
                  transition-all
                  duration-200
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-blue-600 
                  hover:bg-blue-700 
                  text-white
                `}
              >
                <Eye className="w-5 h-5" />
                View Product
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// PropTypes validation for component props
ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    ProductName: PropTypes.string,
    Description: PropTypes.string,
    Price: PropTypes.number,
    OriginalPrice: PropTypes.number,
    image: PropTypes.string,
    Stock: PropTypes.number,
    isNew: PropTypes.bool,
    Type: PropTypes.string,
  }),
  onAddToCart: PropTypes.func
};

// Default props
ProductCard.defaultProps = {
  product: {},
  onAddToCart: () => {
    console.warn('onAddToCart handler is not provided to ProductCard component');
  }
};

export default ProductCard;
