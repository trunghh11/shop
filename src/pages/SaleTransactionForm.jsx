import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSaleTransaction } from '../functions/controllers/saleController';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth'; // Thêm import useAuth
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const SaleTransactionForm = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Lấy thông tin người dùng hiện tại
  const [formData, setFormData] = useState({
    ProductID: '',
    BuyerID: '',
    SellerID: '',
    SellerUserID: '', // Thêm biến mới để lưu UserID
    Quantity: '',
    Price: ''
  });
  const [error, setError] = useState(''); // Thêm state để hiển thị lỗi
  const [isCheckingProduct, setIsCheckingProduct] = useState(false);


  // Thêm effect để điều hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { message: 'Bạn cần đăng nhập để tiếp tục' } });
    }
  }, [user, loading, navigate]);


  // Tự động điền SellerID là người dùng hiện tại
  useEffect(() => {
    if (user && user.uid) {
      setFormData(prev => ({
        ...prev,
        SellerID: user.uid, // Hoặc bạn có thể dùng user.UserID tùy vào cấu trúc dữ liệu
        SellerUserID: user.UserID || '' // Lưu UserID vào biến mới
      }));
    }
  }, [user]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');

        // Khi ProductID thay đổi, reset check
    if (name === 'ProductID') {
      setIsCheckingProduct(false);
    }
  };



    // Kiểm tra sản phẩm thuộc về người dùng khi họ nhập ProductID và rời khỏi trường nhập
  const handleProductBlur = async () => {
    if (!formData.ProductID || isCheckingProduct) return;
    
    try {
      setIsCheckingProduct(true);
      // Lấy thông tin sản phẩm
      const productRef = doc(db, "products", formData.ProductID);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        setError("Sản phẩm không tồn tại");
        setIsCheckingProduct(false);
        return;
      }
      
      const productData = productSnap.data();
      
      // Lấy thông tin post liên quan đến sản phẩm
      if (productData.PostID) {
        const postRef = doc(db, "post", productData.PostID);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const postData = postSnap.data();
          
          // Kiểm tra xem người đăng nhập có phải là người đăng sản phẩm không
          if (user.uid !== postData.PosterID) {
            setError("Bạn chỉ có thể bán sản phẩm do chính mình đăng");
            setIsCheckingProduct(false);
            return;
          } 
        }
      }
      
      setIsCheckingProduct(false);
    } catch (error) {
      console.error("Lỗi khi kiểm tra sản phẩm:", error);
      setError("Lỗi khi kiểm tra thông tin sản phẩm");
      setIsCheckingProduct(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
        // Kiểm tra nếu BuyerID và SellerID giống nhau
    if (formData.BuyerID === formData.SellerUserID) {
      setError('Người mua và người bán không thể là cùng một người');
      return;
    }

        // Kiểm tra người lập giao dịch phải là người bán
    if (user && user.UserID !== formData.SellerUserID) {
      setError('Bạn chỉ có thể tạo giao dịch mua bán với tư cách là người bán');
      return;
    }

    try {
      setIsCheckingProduct(true);
      
      // Kiểm tra lại sản phẩm thuộc về người bán
      const productRef = doc(db, "products", formData.ProductID);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        setError("Sản phẩm không tồn tại");
        setIsCheckingProduct(false);
        return;
      }
      
      const productData = productSnap.data();
      
      if (productData.PostID) {
        const postRef = doc(db, "post", productData.PostID);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const postData = postSnap.data();
          
          if (user.uid !== postData.PosterID) {
            setError("Bạn chỉ có thể bán sản phẩm do chính mình đăng");
            setIsCheckingProduct(false);
            return;
          }
        }
      }
      setIsCheckingProduct(false);
      
      // Nếu đã vượt qua các kiểm tra, tiến hành tạo giao dịch
      console.log("Submitting form data:", formData);
      const { SellerUserID, ...dataToSubmit } = formData;
      const result = await createSaleTransaction(dataToSubmit);
      console.log("Transaction creation result:", result);
      


      // Chuyển hướng về trang chủ sau khi tạo thành công
      navigate('/', { 
        state: { 
          message: "Giao dịch mua bán đã được tạo thành công!", 
          success: true 
        } 
      });
    } catch (error) {
      console.error('Lỗi khi tạo giao dịch mua bán:', error);
      alert('Không thể tạo giao dịch mua bán. Vui lòng thử lại.');
            setIsCheckingProduct(false);

    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, ease: "easeInOut" }} 
      className="container mx-auto px-4 py-8 bg-gray-50"
    >
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Tạo Giao Dịch Mua Bán</h2>
        
        {/* Hiển thị thông báo lỗi nếu có */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="ProductID" className="block text-gray-700 mb-2">Mã Sản Phẩm:</label>
            <input
              type="text"
              id="ProductID"
              name="ProductID"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.ProductID}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="BuyerID" className="block text-gray-700 mb-2">Mã Người Mua:</label>
            <input
              type="text"
              id="BuyerID"
              name="BuyerID"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.BuyerID}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="SellerID" className="block text-gray-700 mb-2">Mã Người Bán:</label>
            <input
              type="text"
              id="SellerID"
              name="SellerID"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.SellerUserID}
              onChange={handleChange}
              required
              readOnly // Không cho phép sửa mã người bán
            />
            <p className="text-xs text-gray-500 mt-1">Bạn chỉ có thể tạo giao dịch với tư cách là người bán</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="Quantity" className="block text-gray-700 mb-2">Số Lượng:</label>
            <input
              type="number"
              id="Quantity"
              name="Quantity"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.Quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="Price" className="block text-gray-700 mb-2">Giá:</label>
            <input
              type="number"
              id="Price"
              name="Price"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.Price}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Có thể để trống và cập nhật sau"
            />
            <p className="text-xs text-gray-500 mt-1">Giá có thể để trống và cập nhật sau</p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SaleTransactionForm;