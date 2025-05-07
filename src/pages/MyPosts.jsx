import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function MyPosts() {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setFullName(userDoc.data().FullName);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchProducts = async () => {
      if (!user) return;

      try {
        const postsCol = collection(db, 'post');
        const postsQuery = query(postsCol, where('PosterID', '==', user.uid));
        const postsSnapshot = await getDocs(postsQuery);

        const userPosts = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const productPromises = userPosts.map(async (post) => {
          const productsCol = collection(db, 'products');
          const productQuery = query(productsCol, where('PostID', '==', post.id));
          const productSnapshot = await getDocs(productQuery);

          return productSnapshot.docs.map((doc) => ({
            id: doc.id,
            postStatus: post.Status,
            ...doc.data(),
          }));
        });

        const productsArray = await Promise.all(productPromises);
        setProducts(productsArray.flat());
      } catch (error) {
        toast.error('Failed to fetch products: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchProducts();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center mt-10">
        <p className="text-gray-700">You need to sign in to view your posts.</p>
        <Link to="/signin" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleDelete = (productId) => {
    setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
    toast.success('Product deleted successfully!');
  };

  const handleEdit = (product) => {
    const newPrice = prompt('Enter new price:', product.Price);
    const newStock = prompt('Enter new stock:', product.Stock);
  
    if (newPrice !== null && newStock !== null) {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === product.id
            ? { ...p, Price: parseFloat(newPrice), Stock: parseInt(newStock, 10) }
            : p
        )
      );
      toast.success('Product updated successfully!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Posts</h1>
      <p className="text-gray-700 mb-4">Welcome, {fullName}!</p>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative group p-4 border rounded-lg shadow hover:shadow-lg transition"
            >
              <Link to={`/product/${product.id}`}>
                <img
                  src={product.image || '/placeholder-image.jpg'}
                  alt={product.ProductName}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-800">{product.ProductName}</h3>
                <p className="text-gray-600 text-sm">{product.Description}</p>
                <p className="text-blue-600 font-medium mt-2">Price: {product.Price} đ</p>
                <p
                  className={`text-sm font-medium mt-2 ${
                    product.postStatus === 'Đang xét duyệt' ? 'text-yellow-500' :
                    product.postStatus === 'Đã duyệt' ? 'text-green-500' :
                    'text-red-500'
                  }`}
                >
                  Status: {product.postStatus}
                </p>
                <p
                  className={`text-md font-medium mt-1 ${
                    product.Stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Còn: {product.Stock > 0 ? `${product.Stock}` : 'Hết hàng'}
                </p>
              </Link>
          
              {/* Nút Xóa và Chỉnh sửa */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm mr-2 hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
