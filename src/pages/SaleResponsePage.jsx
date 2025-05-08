import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { updateSaleTransactionStatus } from '../functions/controllers/saleController';
import { motion } from 'framer-motion';

const SaleResponsePage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  
  const [saleTransaction, setSaleTransaction] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [updatedPrice, setUpdatedPrice] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
    // Effect to check user role when details are loaded
    useEffect(() => {
        if (user && buyerDetails && buyerDetails.id === user.uid) {
          setIsBuyer(true);
        }
        if (user && sellerDetails && sellerDetails.id === user.uid) {
          setIsSeller(true);
        }
      }, [user, buyerDetails, sellerDetails]);

  useEffect(() => {
    console.log("Sale Response component mounted with ID:", saleId);
    const fetchSaleData = async () => {
      try {
        if (!saleId) {
          setError("ID giao dịch bị thiếu");
          return;
        }
        
        if (!user && !loading) {
          navigate('/signin');
          return;
        }
        
        // Tìm giao dịch trong collection saleTransactions
        console.log("Fetching from saleTransactions with ID:", saleId);
        let transactionRef = doc(db, "saleTransactions", saleId);
        let transactionSnap = await getDoc(transactionRef);
        
        if (transactionSnap.exists()) {
          const transactionData = { 
            id: transactionSnap.id, 
            ...transactionSnap.data() 
          };
          console.log("Found transaction data:", transactionData);
          
          setSaleTransaction(transactionData);
          setUpdatedPrice(transactionData.Price || '');
          
          // Fetch related data
          await fetchProductDetails(transactionData.ProductID);
          await fetchUserDetails(transactionData.BuyerID, transactionData.SellerID);
        } else {
          console.log("Transaction not found");
          setError("Không tìm thấy giao dịch mua bán");
        }
      } catch (err) {
        console.error("Error loading transaction data:", err);
        setError("Lỗi khi tải dữ liệu giao dịch: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSaleData();
  }, [saleId, user, loading, navigate]);

//   // Kiểm tra lại vai trò khi buyerDetails hoặc sellerDetails thay đổi
//   useEffect(() => {
//     if (user && buyerDetails && user.uid === buyerDetails.id) {
//       setIsBuyer(true);
//     } else if (user && sellerDetails && user.uid === sellerDetails.id) {
//       setIsSeller(true);
//     }
//   }, [user, buyerDetails, sellerDetails]);
  
  const fetchUserDetails = async (buyerId, sellerId) => {
    try {
      // Lấy thông tin người mua
      const buyerQuery = query(collection(db, "users"), where("UserID", "==", buyerId));
      const buyerSnapshot = await getDocs(buyerQuery);
      if (!buyerSnapshot.empty) {
        setBuyerDetails({ id: buyerSnapshot.docs[0].id, ...buyerSnapshot.docs[0].data() });
      }
      
      // Lấy thông tin người bán
      const sellerQuery = query(collection(db, "users"), where("UserID", "==", sellerId));
      const sellerSnapshot = await getDocs(sellerQuery);
      if (!sellerSnapshot.empty) {
        setSellerDetails({ id: sellerSnapshot.docs[0].id, ...sellerSnapshot.docs[0].data() });
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };
  
  const fetchProductDetails = async (productId) => {
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        setProductDetails({ id: productSnap.id, ...productSnap.data() });
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sản phẩm:", error);
    }
  };

  // Hàm xử lý khi người bán hủy giao dịch
  const handleCancel = async () => {
    try {
      setIsLoading(true);
      // Gọi API để cập nhật trạng thái giao dịch thành "cancelled"
      await updateSaleTransactionStatus(saleId, 'cancelled');
      
      // Chuyển hướng sau khi hủy thành công
      navigate('/', { 
        state: { 
          message: "Giao dịch mua bán đã được hủy thành công!",
          success: true 
        } 
      });
    } catch (err) {
      console.error("Lỗi khi hủy giao dịch:", err);
      setError("Lỗi khi hủy giao dịch: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để cập nhật giá
  const handleUpdatePrice = async () => {
    try {
      setIsLoading(true);
      // Cập nhật giá trong Firestore
      const transactionRef = doc(db, "saleTransactions", saleId);
      await updateDoc(transactionRef, {
        Price: parseFloat(updatedPrice) || 0
      });
      
      // Cập nhật state
      setSaleTransaction(prev => ({
        ...prev,
        Price: parseFloat(updatedPrice) || 0
      }));
      
      setEditingPrice(false);
      alert("Giá đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật giá:", error);
      alert("Không thể cập nhật giá. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý khi người mua xác nhận giao dịch
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      // Kiểm tra xem giá đã được cập nhật chưa
      if (!saleTransaction.Price) {
        alert("Vui lòng cập nhật giá trước khi xác nhận giao dịch");
        setIsLoading(false);
        return;
      }
      
      // Gọi API để cập nhật trạng thái giao dịch thành "completed"
      await updateSaleTransactionStatus(saleId, 'completed');
      
      // Chuyển hướng sau khi xác nhận thành công
      navigate('/', { 
        state: { 
          message: "Giao dịch mua bán đã được hoàn thành thành công!",
          success: true 
        } 
      });
    } catch (err) {
      console.error("Lỗi khi xác nhận giao dịch:", err);
      setError("Lỗi khi xác nhận giao dịch: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-red-500 text-center mb-4">{error}</div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/notification-list')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Quay lại thông báo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!saleTransaction) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, ease: "easeInOut" }} 
      className="container mx-auto px-4 py-8 bg-gray-50"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-2xl font-bold">Chi tiết giao dịch mua bán</h2>
          <p className="text-sm">ID: {saleTransaction.id}</p>
        </div>
        
        <div className="p-6">
          {/* Trạng thái và thời gian */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-700">Trạng thái: </span>
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                saleTransaction.Status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                saleTransaction.Status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {saleTransaction.Status === 'pending' ? 'Đang chờ xử lý' : 
                 saleTransaction.Status === 'completed' ? 'Hoàn thành' : 'Hủy bỏ'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span>Ngày tạo: </span>
              {saleTransaction.CreatedAt?.toDate ? 
                saleTransaction.CreatedAt.toDate().toLocaleString() : 
                new Date(saleTransaction.CreatedAt?.seconds * 1000).toLocaleString()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin sản phẩm */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Thông tin sản phẩm</h3>
              {productDetails ? (
                <>
                  <div className="mb-4">
                    {productDetails.image && (
                      <img 
                        src={productDetails.image} 
                        alt={productDetails.Name} 
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                    )}
                  </div>
                  <p className="mb-2"><span className="font-medium">Tên sản phẩm:</span> {productDetails.Name}</p>
                  <p className="mb-2"><span className="font-medium">Mô tả:</span> {productDetails.Description}</p>
                  <p className="mb-2"><span className="font-medium">Số lượng:</span> {saleTransaction.Quantity}</p>
                  <p className="mb-2"><span className="font-medium">Tình trạng:</span> {productDetails.Condition}</p>
                  
                  {/* Phần hiển thị giá tiền */}
                  <div className="mb-2">
                    <span className="font-medium">Giá: </span>
                    {isBuyer && saleTransaction.Status === 'pending' ? (
                      editingPrice ? (
                        <div className="flex items-center mt-2">
                          <input
                            type="number"
                            value={updatedPrice}
                            onChange={(e) => setUpdatedPrice(e.target.value)}
                            className="w-24 p-1 border border-gray-300 rounded mr-2"
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={handleUpdatePrice}
                            className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingPrice(false)}
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 ml-2"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className={saleTransaction.Price ? "" : "text-red-500"}>
                            {saleTransaction.Price ? `${saleTransaction.Price}đ` : "Chưa được thiết lập"}
                          </span>
                          <button
                            onClick={() => setEditingPrice(true)}
                            className="ml-2 p-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200"
                          >
                            Cập nhật
                          </button>
                        </div>
                      )
                    ) : (
                      <span>{saleTransaction.Price ? `${saleTransaction.Price}đ` : "Chưa được thiết lập"}</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
              )}
            </div>
            
            {/* Thông tin người dùng */}
            <div>
              {/* Thông tin người mua */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Thông tin người mua</h3>
                {buyerDetails ? (
                  <>
                    <p className="mb-2"><span className="font-medium">Tên:</span> {buyerDetails.DisplayName || buyerDetails.UserID}</p>
                    <p className="mb-2"><span className="font-medium">Email:</span> {buyerDetails.Email}</p>
                    <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {buyerDetails.Phone || 'Chưa cung cấp'}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Đang tải thông tin người mua...</p>
                )}
              </div>
              
              {/* Thông tin người bán */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">Thông tin người bán</h3>
                {sellerDetails ? (
                  <>
                    <p className="mb-2"><span className="font-medium">Tên:</span> {sellerDetails.DisplayName || sellerDetails.UserID}</p>
                    <p className="mb-2"><span className="font-medium">Email:</span> {sellerDetails.Email}</p>
                    <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {sellerDetails.Phone || 'Chưa cung cấp'}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Đang tải thông tin người bán...</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Nút hành động dựa trên vai trò và trạng thái */}
          {saleTransaction.Status === 'pending' && (
            <div className="mt-8 flex justify-center space-x-4">
              {/* Chỉ hiển thị nút Hủy cho người bán */}
              {isSeller && (
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Hủy giao dịch
                </button>
              )}
              
              {/* Chỉ hiển thị nút Xác nhận cho người mua */}
              {isBuyer && (
                <button
                  onClick={handleConfirm}
                  disabled={!saleTransaction.Price}
                  className={`px-6 py-3 ${!saleTransaction.Price ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition font-medium flex items-center`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Xác nhận giao dịch
                </button>
              )}
            </div>
          )}
          
          {/* Thông báo trạng thái giao dịch */}
          {saleTransaction.Status !== 'pending' && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              saleTransaction.Status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">
                Giao dịch này đã {saleTransaction.Status === 'completed' ? 'hoàn thành' : 'bị hủy'}!
              </p>
            </div>
          )}
          
          {/* Nút Quay lại */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/notification-list')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Quay lại danh sách thông báo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SaleResponsePage;