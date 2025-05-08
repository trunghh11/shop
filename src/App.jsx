import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import MyAccount from "./pages/Profile";
import UnifiedCheckout from "./pages/Checkout/UnifiedCheckout";
import Products from "./pages/Products";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "./redux/userSlice";
import "react-toastify/dist/ReactToastify.css";
import PasswordReset from './pages/PasswordReset'; 
import PostProduct from './pages/PostProduct';
import MyPosts from './pages/MyPosts';
import UserProfile from './pages/UserProfile';
import ExchangeTransactionForm from './pages/ExchangeTransactionForm';
import SaleTransactionForm from './pages/SaleTransactionForm';
import NotificationItem from './components/Notification';
import NotificationList from './pages/NotificationList';
import ExchangeResponsePage from './pages/ExchangeResponsePage';
import SaleResponsePage from './pages/SaleResponsePage';
function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { uid, email } = user; 
        dispatch(setUser({ uid, email })); 
      } else {
        dispatch(clearUser()); 
      }
      
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    });
    return unsubscribe;
  }, [dispatch]);

  if (loading) return <LoadingScreen message="Welcome to KamiKoto" showTips={true} />;

  return (
    <Router>
      <ScrollToTop />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnHover
      />

      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductView />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/my-account" element={
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={<UnifiedCheckout />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/post-product" element={<PostProduct />} />
            <Route path="/myposts" element={<MyPosts />} />
            <Route path="/create-exchange-transaction" element={<ExchangeTransactionForm />} />
            <Route path="/create-sale-transaction" element={<SaleTransactionForm />} />
            <Route path="/sale-response/:saleId" element={<SaleResponsePage />} />
            <Route path="/notifications" element={<NotificationItem />} />
            <Route path="/notification-list" element={<NotificationList />} />
            <Route path="/exchange-response/:exchangeId" element={<ExchangeResponsePage />} />            
            <Route path="/user/:userId" element={<UserProfile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
