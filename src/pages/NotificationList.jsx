import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { getUserNotifications, markNotificationAsRead } from '../functions/controllers/notificationsController';
import NotificationItem from '../components/Notification';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationList = () => {
  const [user, loading] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Xử lý thông báo thành công từ location state sau khi redirect
  useEffect(() => {
    if (location.state?.message) {
      const toastType = location.state.success ? toast.success : toast.info;
      toastType(location.state.message, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Xóa state để không hiển thị lại thông báo khi refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/signin');
      return;
    }
    
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const fetchedNotifications = await getUserNotifications(user.uid);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Không thể tải thông báo. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user, loading, navigate]);
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, IsRead: true } 
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-6">Thông báo</h1>
      
      {notifications.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onRead={handleMarkAsRead} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Bạn chưa có thông báo nào.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationList;