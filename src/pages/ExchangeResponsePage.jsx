import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateExchangeTransactionStatus } from '../functions/controllers/exchangeController';
import { motion } from 'framer-motion';

const ExchangeResponsePage = () => {
  const { exchangeId } = useParams();
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [exchange, setExchange] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Thêm state để lưu thông tin chi tiết về người dùng và sản phẩm
  const [user1Details, setUser1Details] = useState(null);
  const [user2Details, setUser2Details] = useState(null);
  const [product1Details, setProduct1Details] = useState(null);
  const [product2Details, setProduct2Details] = useState(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }
    
    const fetchExchangeData = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, "exchangeTransactions", exchangeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          
          // Lưu thông tin giao dịch
          setExchange(data);
          
          // Fetch thông tin chi tiết người dùng
          await fetchUserDetails(data.User1ID, data.User2ID);
          
          // Fetch thông tin chi tiết sản phẩm
          await fetchProductDetails(data.ProductID1, data.ProductID2);
          
        } else {
          setError("Không tìm thấy giao dịch trao đổi.");
        }
      } catch (err) {
        setError("Lỗi khi tải thông tin giao dịch: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExchangeData();
  }, [exchangeId, user, loading, navigate]);
  
  // Hàm lấy thông tin chi tiết người dùng
  const fetchUserDetails = async (user1ID, user2ID) => {
    try {
      // Lấy thông tin người dùng 1 - người yêu cầu trao đổi
      const user1Query = query(collection(db, "users"), where("UserID", "==", user1ID));
      const user1Snapshot = await getDocs(user1Query);
      if (!user1Snapshot.empty) {
        setUser1Details({ id: user1Snapshot.docs[0].id, ...user1Snapshot.docs[0].data() });
      }
      
      // Lấy thông tin người dùng 2 - người nhận yêu cầu trao đổi
      const user2Query = query(collection(db, "users"), where("UserID", "==", user2ID));
      const user2Snapshot = await getDocs(user2Query);
      if (!user2Snapshot.empty) {
        setUser2Details({ id: user2Snapshot.docs[0].id, ...user2Snapshot.docs[0].data() });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };
  
  // Hàm lấy thông tin chi tiết sản phẩm
  const fetchProductDetails = async (product1ID, product2ID) => {
    try {
      // Lấy thông tin sản phẩm 1
      const product1Ref = doc(db, "products", product1ID);
      const product1Snap = await getDoc(product1Ref);
      if (product1Snap.exists()) {
        setProduct1Details({ id: product1Snap.id, ...product1Snap.data() });
      }
      
      // Lấy thông tin sản phẩm 2
      const product2Ref = doc(db, "products", product2ID);
      const product2Snap = await getDoc(product2Ref);
      if (product2Snap.exists()) {
        setProduct2Details({ id: product2Snap.id, ...product2Snap.data() });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const handleResponse = async (response) => {
    try {
      setIsLoading(true);
      // Gọi API để cập nhật trạng thái giao dịch
      await updateExchangeTransactionStatus(exchangeId, response);
      
      // Sau khi cập nhật thành công, chuyển hướng đến trang thông báo với message
      navigate('/', { 
        state: { 
          message: `Yêu cầu trao đổi đã được ${response === 'accepted' ? 'chấp nhận' : 'từ chối'} thành công!`,
          success: true 
        } 
      });
    } catch (err) {
      setError(`Lỗi khi ${response === 'accepted' ? 'chấp nhận' : 'từ chối'} giao dịch: ${err.message}`);
      console.error(err);
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
              onClick={() => navigate('/notifications')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Quay lại Thông báo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!exchange) {
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
          <h2 className="text-2xl font-bold">Chi tiết yêu cầu trao đổi</h2>
          <p className="text-sm">ID: {exchange.id || exchange.ExchangeID}</p>
          <p className="text-sm">Ngày tạo: {new Date(exchange.CreatedAt?.seconds * 1000).toLocaleString()}</p>
          <p className="text-sm">Trạng thái: 
            <span className={`ml-2 font-semibold ${
              exchange.Status === 'pending' ? 'text-yellow-200' : 
              exchange.Status === 'accepted' ? 'text-green-200' : 
              'text-red-200'
            }`}>
              {exchange.Status === 'pending' ? 'Đang chờ' : 
               exchange.Status === 'accepted' ? 'Đã chấp nhận' : 
               'Đã từ chối'}
            </span>
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin người dùng 1 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Người yêu cầu</h3>
              {user1Details ? (
                <>
                  <p className="mb-2"><span className="font-medium">Tên người dùng:</span> {user1Details.DisplayName || user1Details.UserID}</p>
                  <p className="mb-2"><span className="font-medium">Email:</span> {user1Details.Email}</p>
                  <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {user1Details.Phone || 'Không có thông tin'}</p>
                </>
              ) : (
                <p className="text-gray-500">Đang tải thông tin người dùng...</p>
              )}
            </div>
            
            {/* Thông tin người dùng 2 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Người nhận yêu cầu</h3>
              {user2Details ? (
                <>
                  <p className="mb-2"><span className="font-medium">Tên người dùng:</span> {user2Details.DisplayName || user2Details.UserID}</p>
                  <p className="mb-2"><span className="font-medium">Email:</span> {user2Details.Email}</p>
                  <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {user2Details.Phone || 'Không có thông tin'}</p>
                </>
              ) : (
                <p className="text-gray-500">Đang tải thông tin người dùng...</p>
              )}
            </div>
          </div>
          
          <hr className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin sản phẩm 1 */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Sản phẩm đề nghị</h3>
              {product1Details ? (
                <>
                  <div className="mb-4">
                    {product1Details.ImageURL && (
                      <img 
                        src={product1Details.ImageURL} 
                        alt={product1Details.Name} 
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                    )}
                  </div>
                  <p className="mb-2"><span className="font-medium">Tên sản phẩm:</span> {product1Details.Name}</p>
                  <p className="mb-2"><span className="font-medium">Mô tả:</span> {product1Details.Description}</p>
                  <p className="mb-2"><span className="font-medium">Số lượng trao đổi:</span> {exchange.Quantity1}</p>
                  <p className="mb-2"><span className="font-medium">Tình trạng:</span> {product1Details.Condition}</p>
                </>
              ) : (
                <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
              )}
            </div>
            
            {/* Thông tin sản phẩm 2 */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Sản phẩm được yêu cầu</h3>
              {product2Details ? (
                <>
                  <div className="mb-4">
                    {product2Details.ImageURL && (
                      <img 
                        src={product2Details.ImageURL} 
                        alt={product2Details.Name} 
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                    )}
                  </div>
                  <p className="mb-2"><span className="font-medium">Tên sản phẩm:</span> {product2Details.Name}</p>
                  <p className="mb-2"><span className="font-medium">Mô tả:</span> {product2Details.Description}</p>
                  <p className="mb-2"><span className="font-medium">Số lượng trao đổi:</span> {exchange.Quantity2}</p>
                  <p className="mb-2"><span className="font-medium">Tình trạng:</span> {product2Details.Condition}</p>
                </>
              ) : (
                <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
              )}
            </div>
          </div>
          
          {/* Hiển thị nút chỉ khi giao dịch đang ở trạng thái "pending" và người dùng hiện tại là User2ID */}
          {exchange.Status === 'pending' && user && user2Details && user.uid === user2Details.id && (
  <div className="mt-8 flex justify-center space-x-4">
    <button
      onClick={() => handleResponse('accepted')}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Chấp nhận trao đổi
    </button>
    <button
      onClick={() => handleResponse('rejected')}
      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Từ chối trao đổi
    </button>
  </div>
)}
          
          {/* Hiển thị thông báo kết quả nếu giao dịch đã được xử lý */}
          {exchange.Status !== 'pending' && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              exchange.Status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">
                Giao dịch này đã được {exchange.Status === 'accepted' ? 'chấp nhận' : 'từ chối'}!
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/notifications')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Quay lại Thông báo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExchangeResponsePage;