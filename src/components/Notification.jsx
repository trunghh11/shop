import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onRead }) => {
  const navigate = useNavigate();
  
  if (!notification) {
    return null;
  }
  
  const handleClick = () => {
    // Đánh dấu thông báo là đã đọc
    onRead(notification.id);
    
    // Nếu thông báo có RelatedID, chuyển đến trang phản hồi trao đổi
    if (notification.RelatedID) {
      console.log("Notification clicked:", notification); // Thêm log để debug

      if (notification.Type === 'exchange') {
        console.log("Navigating to exchange response:", notification.RelatedID);
        navigate(`/exchange-response/${notification.RelatedID}`);
      } else if (notification.Type === 'sale') {
        console.log("Navigating to sale response:", notification.RelatedID);
        navigate(`/sale-response/${notification.RelatedID}`);
      } else {
        console.log("Unknown notification type, using default route");
        navigate(`/notification-detail/${notification.id}`);
      }
    }
  };
  
  // Hàm helper để chuyển đổi timestamp sang Date một cách an toàn
  const formatCreatedAt = () => {
    try {
      // Kiểm tra nếu CreatedAt là đối tượng Firestore Timestamp
      if (notification.CreatedAt && notification.CreatedAt.toDate) {
        return formatDistanceToNow(notification.CreatedAt.toDate(), { addSuffix: true });
      }
      
      // Kiểm tra nếu CreatedAt là số (timestamp)
      if (notification.CreatedAt && typeof notification.CreatedAt.seconds === 'number') {
        return formatDistanceToNow(new Date(notification.CreatedAt.seconds * 1000), { addSuffix: true });
      }
      
      // Trường hợp là Date hoặc string ISO
      if (notification.CreatedAt) {
        return formatDistanceToNow(new Date(notification.CreatedAt), { addSuffix: true });
      }
      
      return 'không xác định';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'không xác định';
    }
  };
  
  return (
    <div 
      className={`p-4 border-b ${notification.IsRead ? 'bg-white' : 'bg-blue-50'} cursor-pointer hover:bg-gray-100`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="mr-3 text-xl">
          🔔
        </div>
        <div className="flex-1">
          <p className="text-gray-800">{notification.Message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCreatedAt()}
          </p>
          {notification.RelatedID && (
            <p className="text-xs text-blue-500 mt-1">Nhấn để xem chi tiết</p>
          )}
        </div>
        {!notification.IsRead && (
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;