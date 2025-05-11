import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExchangeTransaction } from '../functions/controllers/exchangeController';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const ExchangeTransactionForm = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    ExchangeID: '',
    User1ID: '',
    User2ID: '',
    ProductID1: '',
    ProductID2: '',
    Quantity1: '',
    Quantity2: ''
  });
  const [error, setError] = useState('');
  // Thêm effect để điều hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { message: 'Bạn cần đăng nhập để tiếp tục' } });
    }
  }, [user, loading, navigate]);


  // Tự động điền User1ID là UserID của người dùng hiện tại
  useEffect(() => {
    if (user && user.UserID) {
      setFormData(prev => ({
        ...prev,
        User1ID: user.UserID
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Kiểm tra người gửi và người nhận trao đổi không được giống nhau
    if (formData.User1ID === formData.User2ID) {
      setError('Người gửi và người nhận yêu cầu trao đổi không thể là cùng một người');
      return;
    }

    // Kiểm tra ProductID1 và ProductID2 không được giống nhau
    if (formData.ProductID1 === formData.ProductID2) {
      setError('Không thể trao đổi hai sản phẩm có cùng mã sản phẩm');
      return;
    }

    
    try {
      await createExchangeTransaction(formData);
      // Redirect to home page after successful creation
      navigate('/', {
        state: {
          message: "Yêu cầu trao đổi đã được tạo thành công!",
          success: true
        }
      });
    } catch (error) {
      console.error('Error creating exchange transaction:', error);
      alert('Failed to create exchange transaction. Please try again.');
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
        <h2 className="text-2xl font-bold mb-6 text-center">Create Exchange Transaction</h2>
        
        {/* Hiển thị thông báo lỗi nếu có */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="User1ID" className="block text-gray-700 mb-2">User 1 ID:</label>
            <input
              type="text"
              id="User1ID"
              name="User1ID"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.User1ID}
              onChange={handleChange}
              required
              readOnly // Không cho phép sửa người yêu cầu
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="User2ID" className="block text-gray-700 mb-2">User 2 ID:</label>
            <input
              type="text"
              id="User2ID"
              name="User2ID"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.User2ID}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="ProductID1" className="block text-gray-700 mb-2">Product 1 ID:</label>
            <input
              type="text"
              id="ProductID1"
              name="ProductID1"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.ProductID1}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="ProductID2" className="block text-gray-700 mb-2">Product 2 ID:</label>
            <input
              type="text"
              id="ProductID2"
              name="ProductID2"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.ProductID2}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="Quantity1" className="block text-gray-700 mb-2">Quantity 1:</label>
            <input
              type="number"
              id="Quantity1"
              name="Quantity1"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.Quantity1}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="Quantity2" className="block text-gray-700 mb-2">Quantity 2:</label>
            <input
              type="number"
              id="Quantity2"
              name="Quantity2"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.Quantity2}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ExchangeTransactionForm;