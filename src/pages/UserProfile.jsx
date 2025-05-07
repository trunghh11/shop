import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserInfo(userDocSnap.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const postsCol = collection(db, 'post');
        const postsQuery = query(postsCol, where('PosterID', '==', userId));
        const postsSnapshot = await getDocs(postsQuery);

        const userPosts = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const productPromises = userPosts.map(async (post) => {
          const productsCol = collection(db, 'products');
          const productQuery = query(productsCol, where('PostID', '==', post.id), where('showOnHome', '==', true));
          const productSnapshot = await getDocs(productQuery);

          return productSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        });

        const productsArray = await Promise.all(productPromises);
        setProducts(productsArray.flat());
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchProducts();
  }, [userId]);

  const extractFacebookUsername = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').filter(Boolean)[0] || 'Facebook Profile';
    } catch {
      return 'Facebook Profile';
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-blue-600 hover:underline mb-6"
      >
        &larr; Back
      </button>

      {/* User Information */}
      {userInfo && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center">
            <img
              src={userInfo.profilePic || 'https://img.freepik.com/vecteurs-premium/icones-utilisateur-comprend-icones-utilisateur-symboles-icones-personnes-elements-conception-graphique-qualite-superieure_981536-526.jpg?semt=ais_hybrid&w=740'}
              alt={userInfo.FullName}
              className="w-16 h-16 rounded-full object-cover mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">{userInfo.FullName}</h1>
              <p className="text-gray-600">Email:  {userInfo.Email || 'No email provided'}</p>
              <p className="text-gray-600">Phone:  {userInfo.Phone || 'No phone number provided'}</p>
              {userInfo.FacebookLink && (
                <p className="text-gray-600"> {'Facebook: '}
                  <a
                    href={userInfo.FacebookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {extractFacebookUsername(userInfo.FacebookLink)}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <hr className="my-8 border-gray-300" />

      {/* User's Posts */}
      <h2 className="text-2xl font-bold mb-6">Posts by {userInfo?.FullName || 'User'}</h2>
      {products.length === 0 ? (
        <p>No products found for this user.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="p-4 border rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={product.image || '/placeholder-image.jpg'}
                alt={product.ProductName}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-800">{product.ProductName}</h3>
              <p className="text-gray-600 text-sm">{product.Description}</p>
              <p className="text-blue-600 font-medium mt-2">Price: {product.Price} đ</p>
              <p
                className={`text-md font-medium mt-1 ${
                  product.Stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Còn: {product.Stock > 0 ? `${product.Stock}` : 'Hết hàng'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
