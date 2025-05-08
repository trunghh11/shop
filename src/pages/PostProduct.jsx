import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';

function PostProduct() {
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState({
    ProductName: '',
    Description: '',
    Price: '',
    Stock: '',
    CategoryID: '',
    Condition: '',
    FundID: '',
    PostID: '',
    showOnHome: false,
  });
  const [images, setImages] = useState({ image: null, image2: null, image3: null });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const storage = getStorage();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!user) {
      toast.warn('You must be logged in to post a product.');
      navigate('/signin'); // Chuyển hướng đến trang đăng nhập
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    setImages((prev) => ({ ...prev, [name]: files[0] }));
  };

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `products/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedImages = await Promise.all(
        Object.values(images).map((file) => (file ? uploadImage(file) : null))
      );

      const postData = {
        Content: product.Description, // Use Description as Post Content
        CreatedAt: new Date(),
        PosterID: user.uid,
        ReviewerID: null,
        Status: 'Pending',
      };

      const postsCol = collection(db, 'post');
      const postRef = await addDoc(postsCol, postData);

      const productData = {
        ...product,
        Price: parseFloat(product.Price),
        Stock: parseInt(product.Stock, 10),
        PostID: postRef.id || '',
        image: uploadedImages[0] || '',
        image2: uploadedImages[1] || '',
        image3: uploadedImages[2] || '',
      };

      const productsCol = collection(db, 'products');
      await addDoc(productsCol, productData);

      toast.success('Product and post created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error posting product:', error);
      toast.error('Failed to post product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Post a Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="ProductName"
            value={product.ProductName}
            onChange={handleChange}
            placeholder="Product Name"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <textarea
            name="Description"
            value={product.Description}
            onChange={handleChange}
            placeholder="Description"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            name="Price"
            value={product.Price}
            onChange={handleChange}
            placeholder="Price (đ)"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            name="Stock"
            value={product.Stock}
            onChange={handleChange}
            placeholder="Stock"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="CategoryID"
            value={product.CategoryID}
            onChange={handleChange}
            placeholder="Category ID"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="Condition"
            value={product.Condition}
            onChange={handleChange}
            placeholder="Condition"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image 1</label>
            <input
              type="file"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image 2</label>
            <input
              type="file"
              name="image2"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image 3</label>
            <input
              type="file"
              name="image3"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Posting...' : 'Post Product'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostProduct;
