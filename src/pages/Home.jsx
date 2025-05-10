import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom"; 
import { motion } from "framer-motion"; 
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import ReactSlider from "react-slider";
import "./Home.css"

function Home() {
  const [products, setProducts] = useState([]);
  const [sortOption, setSortOption] = useState("dateNewest");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCol = collection(db, "products");
      const productSnapshot = await getDocs(productsCol);
      const productList = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const postsCol = collection(db, "post");
      const postSnapshot = await getDocs(postsCol);
      const postList = postSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Kết hợp dữ liệu sản phẩm với bài đăng dựa trên PostID
      const combinedProducts = productList.map((product) => {
        const relatedPost = postList.find((post) => post.id === product.PostID);
        return {
          ...product,
          CreatedAt: relatedPost?.CreatedAt || null, // Gắn CreatedAt từ bài đăng
        };
      });

      const filteredProducts = combinedProducts.filter(product => product.showOnHome);
      setProducts(filteredProducts);
    };
    fetchProducts();
  }, []);

  /**
   * Handles adding a product to the cart
   * @param {Object} product - The product to add to cart
   */
  const handleAddToCart = useCallback((product) => {
    dispatch(addToCart({
      productId: product.id,
      quantity: 1
    }));
  }, [dispatch]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  /**
   * Handles sorting products based on the selected option
   */
  const sortedProducts = [...products]
    .filter((product) => product.Price >= priceRange[0] && product.Price <= priceRange[1]) // Lọc theo giá
    .sort((a, b) => {
      if (sortOption === "priceAsc") {
        return a.Price - b.Price; // Sắp xếp theo giá tăng dần
      } else if (sortOption === "priceDesc") {
        return b.Price - a.Price; // Sắp xếp theo giá giảm dần
      } else if (sortOption === "dateNewest") {
        const dateA = a.CreatedAt?.seconds ? new Date(a.CreatedAt.seconds * 1000) : new Date(0);
        const dateB = b.CreatedAt?.seconds ? new Date(b.CreatedAt.seconds * 1000) : new Date(0);
        return dateB - dateA; // Sắp xếp theo ngày mới nhất
      } else if (sortOption === "dateOldest") {
        const dateA = a.CreatedAt?.seconds ? new Date(a.CreatedAt.seconds * 1000) : new Date(0);
        const dateB = b.CreatedAt?.seconds ? new Date(b.CreatedAt.seconds * 1000) : new Date(0);
        return dateA - dateB; // Sắp xếp theo ngày cũ nhất
      }
      return 0;
    });

  return (
    <motion.div
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.6, ease: "easeInOut" }} 
    className="container mx-auto px-4 py-8 bg-gray-50"
  >
      {/* Banner Image */}
      <img
        src="/banners/3.webp"
        alt="KamiKoto Banner"
        className="w-full mb-6 mx-auto"
      />

      {/* Sort Options */}
      <div className="flex justify-between mb-4">
        <div className="w-1/4 pr-4">
          <h2 className="text-lg font-semibold mb-4">Filter by Price</h2>
          <ReactSlider
            className="horizontal-slider"
            thumbClassName="thumb"
            trackClassName="track"
            min={0}
            max={10000000}
            step={50000}
            value={priceRange}
            onChange={(value) => setPriceRange(value)}
            renderThumb={(props) => <div {...props}></div>}
          />
          {/* Hiển thị giá trị tối thiểu và tối đa bên dưới thanh trượt */}
          <div className="slider-values flex justify-between mt-2">
            <span className="text-[15px]">{formatCurrency(priceRange[0])}</span>
            <span className="text-[15px]">{formatCurrency(priceRange[1])}</span>
          </div>
        </div>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 h-[50px] border border-gray-300 rounded-lg"
        >
          <option value="dateNewest">Sort by Date (Newest)</option>
          <option value="dateOldest">Sort by Date (Oldest)</option>
          <option value="priceAsc">Sort by Price (Low to High)</option>
          <option value="priceDesc">Sort by Price (High to Low)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {sortedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      <br /><br /><br />
      <div className="block md:hidden mb-6 text-center">
        <Link to="/products">
          <button className="animate-pulse bg-blue-600 text-white py-4 px-8 rounded-full shadow-lg transform transition duration-500 hover:scale-105">
            Explore More Products
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default Home;
