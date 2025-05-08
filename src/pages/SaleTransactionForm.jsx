import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSaleTransaction } from '../functions/controllers/saleController';
import { motion } from 'framer-motion';

const SaleTransactionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ProductID: '',
    BuyerID: '',
    SellerID: '',
    Quantity: '',
    Price: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting form data:", formData);
      const result = await createSaleTransaction(formData);
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
              value={formData.SellerID}
              onChange={handleChange}
              required
            />
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