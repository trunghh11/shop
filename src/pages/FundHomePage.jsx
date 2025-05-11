import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // For navigation to FundDetailPage

const FundHomePage = () => {
  const [funds, setFunds] = useState([]); // Store funds data
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const navigate = useNavigate(); // Initialize navigate hook for routing


  useEffect(() => {
    // Fetch funds data from Firestore when component mounts
    const fetchFunds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "fund"));
        const fundsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFunds(fundsArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching funds:", error);
        setLoading(false);
      }
    };

    fetchFunds(); // Fetch data on component mount
  }, []);

  // Display a loading spinner while fetching funds
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Navigate to FundDetailPage when a card is clicked
  const handleCardClick = (id) => {
    navigate(`/fund/${id}`); // Navigate to FundDetailPage with fund ID in the URL
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header Section */}
      <section
        className="relative bg-cover bg-center h-96"
        style={{
          backgroundImage: "url(https://via.placeholder.com/1200x600)",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white p-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Quyên góp và gây quỹ
          </h1>
          <div className="mt-6 flex justify-center gap-4">
            <button className="bg-white text-gray-900 px-6 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300">
              Đăng ký tham gia
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
              Đọc kết thúc
            </button>
          </div>
        </div>
      </section>

      {/* ABCXYZ Section */}
      <section className="px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">
          Cùng nhau xây dựng giấc mơ cho những người cần giúp đỡ
        </h2>

        {/* Grouping Donation Cards with 2 Columns */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 mx-auto max-w-10xl"   
        >
          {funds.map((fund) => (
            <>
              {/* Column Left */}
              <div className="flex justify-end" key={fund.id}>
                <motion.div
                  className="bg-white p-6 rounded-xl shadow-lg w-full sm:w-80"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  onClick={() => handleCardClick(fund.id)}
                >
                  <img
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    src={fund.QRCode || "https://via.placeholder.com/400x300"}
                    alt={fund.FundName}
                  />
                  <h3 className="text-xl font-semibold">{fund.FundName}</h3>
                  <p className="mt-2 text-gray-600">
                    Kết thúc: {new Date(fund.EndDate.seconds * 1000).toLocaleDateString()}
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {Math.round(((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100)}% mục tiêu đã hoàn thành
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Column Right */}
              <div className="flex justify-start" key={fund.id}>
                <motion.div
                  className="bg-white p-6 rounded-xl shadow-lg w-full sm:w-80"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  onClick={() => handleCardClick(fund.id)}
                >
                  <img
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    src={fund.QRCode || "https://via.placeholder.com/400x300"}
                    alt={fund.FundName}
                  />
                  <h3 className="text-xl font-semibold">{fund.FundName}</h3>
                  <p className="mt-2 text-gray-600">
                    Kết thúc: {new Date(fund.EndDate.seconds * 1000).toLocaleDateString()}
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {Math.round(((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100)}% mục tiêu đã hoàn thành
                    </p>
                  </div>
                </motion.div>
              </div>
            </>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FundHomePage;
