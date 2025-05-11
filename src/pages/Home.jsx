import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import ReactSlider from "react-slider";
import "./Home.css";

function Home() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [sortOption, setSortOption] = useState("dateNewest");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      const [productSnapshot, postSnapshot, userSnapshot] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "post")),
        getDocs(collection(db, "users")),
      ]);

      const postList = postSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userList = userSnapshot.docs.map((doc) => ({
  id: doc.id,              // 🔥 thêm dòng này
  ...doc.data()
}));

      setUsers(userList);

      const productList = productSnapshot.docs.map((doc) => {
        const product = { id: doc.id, ...doc.data() };
        const relatedPost = postList.find((post) => post.id === product.PostID);
        const seller = userList.find((u) => u.id === relatedPost?.PosterID);

        return {
          ...product,
          CreatedAt: relatedPost?.CreatedAt || null,
          PosterID: relatedPost?.PosterID || null,
          SellerAvgRating: parseFloat(seller?.AvgRating || 0),
          SellerRatingCount: parseInt(seller?.RatingCount || 0),
        };
      });

      const filteredProducts = productList.filter((p) => p.showOnHome);
      setProducts(filteredProducts);
    };

    fetchProducts();
  }, []);

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

  const sortedProducts = [...products]
    .filter((product) => product.Price >= priceRange[0] && product.Price <= priceRange[1])
    .sort((a, b) => {
      if (sortOption === "priceAsc") {
        return a.Price - b.Price;
      } else if (sortOption === "priceDesc") {
        return b.Price - a.Price;
      } else if (sortOption === "dateNewest") {
        const dateA = a.CreatedAt?.seconds ? new Date(a.CreatedAt.seconds * 1000) : new Date(0);
        const dateB = b.CreatedAt?.seconds ? new Date(b.CreatedAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      } else if (sortOption === "dateOldest") {
        const dateA = a.CreatedAt?.seconds ? new Date(a.CreatedAt.seconds * 1000) : new Date(0);
        const dateB = b.CreatedAt?.seconds ? new Date(b.CreatedAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      } else if (sortOption === "sellerRating") {

        console.log(a.AvgRating)
        // Sort by AvgRating DESC, then RatingCount DESC
        if (b.SellerAvgRating !== a.SellerAvgRating) {
          return b.SellerAvgRating - a.SellerAvgRating;
        }
        return b.SellerRatingCount - a.SellerRatingCount;
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

      {/* Sort & Filter */}
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
          <option value="sellerRating">Sort by Seller Rating</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            posterRating={{
              avg: product.SellerAvgRating,
              count: product.SellerRatingCount
  }}
          />
        ))}
      </div>

      {/* Mobile View Explore More */}
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