import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const FundHomePage = () => {
  const [fundsData, setFundsData] = useState({
    fundraisingCampaigns: [], // Quỹ có type "Gây quỹ bằng tiền"
    allFunds: [], // Tất cả các quỹ
    productSaleFunds: [], // Quỹ có type "Gây quỹ bằng bán đồ"
    items: [], // donated_item
    transactions: [] // fund_transaction
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Kiểm tra trạng thái xác thực của người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser ? `Logged in as ${currentUser.uid}` : "Not logged in");
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log("Bắt đầu truy vấn dữ liệu...");

        // Truy vấn tất cả các quỹ
        const fundSnapshot = await getDocs(
          query(collection(db, "fund"), orderBy("TargetAmount", "desc"), limit(12))
        );
        const fundsArray = fundSnapshot.docs.map((doc) => {
          // Đảm bảo ID luôn có giá trị
          if (!doc.id) {
            console.error("Document without ID:", doc);
          }
          return {
            id: doc.id, // ID của document
            FundID: doc.data().FundID || parseInt(doc.id), // FundID từ data hoặc fallback
            ...doc.data(),
          };
        });

        console.log(`Đã truy vấn được ${fundsArray.length} fund:`, fundsArray);

        // Phân loại các quỹ theo Type
        const fundraisingCampaigns = fundsArray.filter(fund => fund.Type === "Gây quỹ bằng tiền");
        const productSaleFunds = fundsArray.filter(fund => fund.Type === "Gây quỹ bằng tiền");

        // Truy vấn donated_item
        const itemSnapshot = await getDocs(
          query(collection(db, "donated_item"), limit(6))
        );
        const itemsArray = itemSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`Đã truy vấn được ${itemsArray.length} items:`, itemsArray);

        // Truy vấn fund_transaction chỉ khi đã đăng nhập
        let transactionsArray = [];
        if (user) {
          const transactionSnapshot = await getDocs(
            query(collection(db, "fund_transaction"), orderBy("Timestamp", "desc"), limit(6))
          );
          transactionsArray = transactionSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log(`Đã truy vấn được ${transactionsArray.length} transactions:`, transactionsArray);
        } else {
          console.log("Không truy vấn fund_transaction vì người dùng chưa đăng nhập");
        }

        setFundsData({
          fundraisingCampaigns,
          allFunds: fundsArray,
          productSaleFunds,
          items: itemsArray,
          transactions: transactionsArray
        });
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi truy vấn dữ liệu:", error);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]); // Thêm user vào dependencies để truy vấn lại khi trạng thái đăng nhập thay đổi

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('vi-VN');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0 VNĐ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Calculate progress percentage for display
  const calculateProgress = (current, target) => {
    if (!current || !target) return 0;
    const percentage = (current / target) * 100;
    return Math.min(percentage, 100).toFixed(0);
  };

  // Navigation handlers
  const handleFundClick = (fundId) => {
    if (!fundId) {
      console.error("Fund ID is missing or invalid:", fundId);
      alert("Không tìm thấy ID của quỹ");
      return;
    }
    console.log("Navigating to fund detail page with ID:", fundId);
    navigate(`/fund-detail-page/${fundId}`);
  };

  const handleDonation = (fund, e) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt
    console.log("Donate to fund:", fund.FundName);
    alert(`Bạn sẽ quyên góp cho quỹ: ${fund.FundName}`);
  };

  // CẤU HÌNH LẠI: Xử lý khi nhấp vào vật phẩm, sẽ chuyển đến trang chi tiết quỹ tương ứng
  const handleItemClick = (item) => {
    if (!item || !item.FundID) {
      console.error("Item doesn't have a valid FundID:", item);
      alert("Không tìm thấy quỹ liên quan đến vật phẩm này");
      return;
    }
    
    // Tìm fund dựa vào FundID trong item
    const relatedFund = fundsData.allFunds.find(fund => 
      fund.FundID === item.FundID || 
      fund.id === item.FundID.toString()
    );
    
    if (relatedFund) {
      console.log("Navigating to related fund:", relatedFund.FundName, "with ID:", relatedFund.id);
      navigate(`/fund-detail-page/${relatedFund.id}`);
    } else {
      // Nếu không tìm thấy trong danh sách đã có, chuyển hướng trực tiếp bằng FundID
      console.log("Fund not found in current list, navigating directly using FundID:", item.FundID);
      navigate(`/fund-detail-page/${item.FundID}`);
    }
  };

  const handleTransactionClick = (id) => {
    navigate(`/transaction-detail/${id}`);
  };

  // Render a card for a fund
  const renderFundCard = (fund) => {
    return (
      <motion.div
        key={fund.id}
        className="bg-white p-6 rounded-xl shadow-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        onClick={() => handleFundClick(fund.id)}
      >
        <img
          className="w-full h-48 object-cover rounded-lg mb-4"
          src={fund.BannerURL || "https://via.placeholder.com/400x300"}
          alt={fund.FundName}
        />
        <h3 className="text-xl font-semibold">{fund.FundName}</h3>
        <div className="mt-2 text-gray-600">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
            {fund.Type || "Chưa phân loại"}
          </span>
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            {fund.Status}
          </span>
        </div>
        <p className="mt-2 text-gray-600">
          Kết thúc: {formatDate(fund.EndDate)}
        </p>
        <div className="mt-4">
          <div className="bg-gray-200 h-2 rounded-full">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${calculateProgress(fund.CurrentAmount, fund.TargetAmount)}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{calculateProgress(fund.CurrentAmount, fund.TargetAmount)}% mục tiêu</span>
            <span>{formatCurrency(fund.CurrentAmount || 0)} / {formatCurrency(fund.TargetAmount)}</span>
          </div>
        </div>
        <div className="flex mt-4 gap-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              if (!fund.id) {
                e.preventDefault();
                alert("Không tìm thấy ID của quỹ");
                return;
              }
              handleFundClick(fund.id);
            }}
          >
            Xem chi tiết
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
            onClick={(e) => handleDonation(fund, e)}
          >
            Quyên góp
          </button>
        </div>
      </motion.div>
    );
  };

  // Render a card for a donated item
  const renderItemCard = (item) => (
    <motion.div
      key={item.id}
      className="bg-white p-6 rounded-xl shadow-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={() => handleItemClick(item)} // Truyền toàn bộ item thay vì chỉ ID
    >
      <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </div>
      <img
        className="w-full h-32 object-cover rounded-lg mb-2"
        src={item.PhotoURL || "https://via.placeholder.com/150"}
        alt={item.ItemCategory}
      />
      <h3 className="text-xl font-semibold text-center">{item.ItemCategory}</h3>
      <div className="mt-2 text-gray-600 text-center">
        <p>Số lượng: {item.Quantity}</p>
        <p>Ngày quyên góp: {formatDate(item.DonatedAt)}</p>
        
      </div>
      <div className="flex mt-4 gap-2">
        <button
          className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(item); // Truyền toàn bộ item
          }}
        >
          Xem quỹ liên quan
        </button>
      </div>
    </motion.div>
  );

  // Render a card for a transaction
  const renderTransactionCard = (transaction) => (
    <motion.div
      key={transaction.id}
      className="bg-white p-6 rounded-xl shadow-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={() => handleTransactionClick(transaction.id)}
    >
      <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">GD-{transaction.FundTransactionID}</span>
        <span className={`text-sm px-2 py-1 rounded-full ${transaction.IsVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {transaction.IsVerified ? 'Đã xác minh' : 'Chờ xác minh'}
        </span>
      </div>
      <p className="mt-2 text-gray-600">
        Ngày giao dịch: {formatDate(transaction.Timestamp)}
      </p>
      <p className="mt-2 text-xl font-bold text-green-600">
        {formatCurrency(transaction.Amount)}
      </p>
      <div className="flex mt-4">
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          onClick={(e) => {
            e.stopPropagation();
            handleTransactionClick(transaction.id);
          }}
        >
          Xem chi tiết
        </button>
      </div>
    </motion.div>
  );

  // Display a loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero Section */}
      <section className="py-8 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Nền tảng gây quỹ cộng đồng</h1>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-bold">Chiến dịch gây quỹ</h2>
              <p className="text-sm text-gray-600">Quyên góp tiền mặt</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-center cursor-pointer hover:bg-green-100 transition">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="font-bold">Chiến dịch quyên góp</h2>
              <p className="text-sm text-gray-600">Tất cả các quỹ</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-center cursor-pointer hover:bg-yellow-100 transition">
              <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="font-bold">Gây quỹ bằng bán đồ</h2>
              <p className="text-sm text-gray-600">Mua sản phẩm để ủng hộ</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg text-center cursor-pointer hover:bg-purple-100 transition">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h2 className="font-bold">Vật phẩm quyên góp</h2>
              <p className="text-sm text-gray-600">Quyên góp đồ vật</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg text-center cursor-pointer hover:bg-red-100 transition">
              <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="font-bold">Giao dịch quyên góp</h2>
              <p className="text-sm text-gray-600">Các giao dịch đã thực hiện</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Chiến dịch gây quỹ (chỉ chứa những fund có type là "Gây quỹ bằng tiền") */}
      <section className="py-8 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Chiến dịch gây quỹ bằng tiền mặt</h2>
          {fundsData.fundraisingCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundsData.fundraisingCampaigns.map((fund) => renderFundCard(fund))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg text-center">
              <p className="text-gray-600">Chưa có chiến dịch gây quỹ bằng tiền nào được tạo</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Chiến dịch quyên góp (tất cả các quỹ trong fund) */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Tất cả chiến dịch quyên góp</h2>
          {fundsData.allFunds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundsData.allFunds.map((fund) => renderFundCard(fund))}
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600">Chưa có chiến dịch quyên góp nào được tạo</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Gây quỹ bằng bán đồ (chỉ chứa những fund có type là "Gây quỹ bằng bán đồ") */}
      <section className="py-8 bg-yellow-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Gây quỹ bằng bán đồ</h2>
          {fundsData.productSaleFunds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundsData.productSaleFunds.map((fund) => renderFundCard(fund))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg text-center">
              <p className="text-gray-600">Chưa có chiến dịch gây quỹ bằng bán đồ nào được tạo</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Vật phẩm quyên góp (donated_item) */}
      <section className="py-8 bg-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Vật phẩm quyên góp</h2>
          {fundsData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fundsData.items.map((item) => renderItemCard(item))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg text-center">
              <p className="text-gray-600">Chưa có vật phẩm nào được quyên góp</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Giao dịch quyên góp (fund_transaction) */}
      <section className="py-8 bg-red-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Giao dịch quyên góp</h2>
          {user ? (
            fundsData.transactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fundsData.transactions.map((transaction) => renderTransactionCard(transaction))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg text-center">
                <p className="text-gray-600">Chưa có giao dịch quyên góp nào được thực hiện</p>
              </div>
            )
          ) : (
            <div className="bg-white p-6 rounded-lg text-center">
              <p className="text-gray-600">Vui lòng đăng nhập để xem giao dịch quyên góp</p>
              <button
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Chung tay quyên góp ngay hôm nay</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Mỗi sự đóng góp của bạn, dù nhỏ hay lớn, đều có thể tạo nên những thay đổi tích cực cho cộng đồng
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300">
            Quyên góp ngay
          </button>
        </div>
      </section>
    </div>
  );
};

export default FundHomePage;