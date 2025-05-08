import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { toast, ToastContainer } from 'react-toastify';
import { ArrowLeft, Package2, ShoppingCart } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

function ProductView() {
  const { id } = useParams(); // Changed from saleId to id to match App.jsx route
  const [product, setProduct] = useState(null);
  const [post, setPost] = useState(null);
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user?.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to sign-in page if user is not authenticated
    if (!user) {
      toast.warn('You must be logged in to see this contents.');
      navigate('/signin');
      return;
    }

    const fetchProductAndPost = async () => {
      try {
        const productDocRef = doc(db, "products", id);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          const productData = { id: productDocSnap.id, ...productDocSnap.data() };
          setProduct(productData);
          setActiveImage(productData.image);

          // Fetch the associated post using PostID
          const postDocRef = doc(db, "post", productData.PostID);
          const postDocSnap = await getDoc(postDocRef);

          if (postDocSnap.exists()) {
            const postData = postDocSnap.data();
            setPost(postData);

            // Fetch the poster's information
            const posterDocRef = doc(db, "users", postData.PosterID);
            const posterDocSnap = await getDoc(posterDocRef);
            if (posterDocSnap.exists()) {
              setPoster(posterDocSnap.data());
            }
          }

          // Fetch similar products
          await fetchSimilarProducts(productData);
        } else {
          toast.error("Product not found!");
        }
      } catch (error) {
        console.error("Error fetching product, post, or poster:", error);
        toast.error("An error occurred while fetching the product or post.");
      } finally {
        setLoading(false);
      }
    };

    /**
     * Fetches products that are similar to the current product based on category or brand
     * @param {Object} currentProduct - The product to find similar products for
     */
    const fetchSimilarProducts = async (currentProduct) => {
      try {
        setLoadingSimilar(true);

        // Query products with the same category/type
        const productsRef = collection(db, "products");
        const typeQuery = query(
          productsRef,
          where("type", "==", currentProduct.type),
          limit(5)
        );

        const querySnapshot = await getDocs(typeQuery);
        const similarProductsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // Filter out the current product
          .filter(prod => prod.id !== currentProduct.id);

        setSimilarProducts(similarProductsData);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchProductAndPost();
  }, [id, user, navigate]); // Fixed dependency array to use id

  /**
   * Handles adding a similar product to cart
   * @param {Object} product - The product to add to cart
   */
  const handleAddSimilarToCart = (product) => {
    if (!user) {
      toast.error("You must be logged in to add items to your cart.");
      return;
    }
    dispatch(addToCart({
      productId: product.id,
      quantity: 1
    }));
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0 ₫'; // Handle undefined, null, or invalid price
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleImageClick = (image) => {
    setActiveImage(image);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/products" className="text-blue-600 hover:underline">Return to Products</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Rest of your component rendering code */}
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
    </div>
  );
}

export default ProductView;