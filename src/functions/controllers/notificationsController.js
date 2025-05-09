import { doc, updateDoc, collection, setDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import Notification from "../models/notifications";

export const createNotification = async (uid, notificationData) => {
    try {
      const notificationID = doc(collection(db, "notifications")).id;
      
      console.log("===== DEBUG createNotification =====");
      console.log("uid:", uid);
      console.log("notificationData:", JSON.stringify(notificationData));
      console.log("Checking RelatedID:", notificationData.RelatedID);
      console.log("All keys in notificationData:", Object.keys(notificationData));
      
      const notification = new Notification({
        NotificationID: notificationID,
        uid: uid,
        Message: notificationData.Message,
        IsRead: false,
        CreatedAt: new Date(),
        RelatedID: notificationData.RelatedID || "",
        Type: notificationData.Type || "" // Đảm bảo trường Type được truyền vào
      });
      
      console.log("Created notification object:", JSON.stringify(notification));
      console.log("RelatedID in notification:", notification.RelatedID);
      console.log("Type in notification:", notification.Type);  // Thêm log cho Type

      const docRef = doc(db, "notifications", notificationID);
      await setDoc(docRef, notification.toJSON());
      
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  };

  export const getUserNotifications = async (uid) => {
    try {
          // Đảm bảo uid tồn tại
    if (!uid) {
      console.error("No UID provided to getUserNotifications");
      return [];
    }
    console.log("Fetching notifications for uid:", uid);

      // Lấy thông báo từ Firestore
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("uid", "==", uid), orderBy("CreatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      console.log("Fetched notifications count:", querySnapshot.size); // Thêm log để kiểm tra
      
      // Chuyển đổi kết quả thành mảng đối tượng
      const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Notification data:", data); // Thêm log kiểm tra từng thông báo
        return {
          id: doc.id,
          ...data,
        };
      });
      
      return notifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  };
// // Lấy thông báo dựa trên uid (không phải UserID)
// export const getUserNotifications = async (uid) => {
//   try {
//     console.log("Fetching notifications for user with uid:", uid);
    
//     const q = query(
//       collection(db, "notifications"),
//       where("uid", "==", uid),    // Lọc theo uid
//       orderBy("CreatedAt", "desc")
//     );
    
//     const querySnapshot = await getDocs(q);
//     const notifications = querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));
    
//     console.log("Fetched notifications:", notifications);
//     return notifications;
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     throw error;
//   }
// };

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationID) => {
  try {
    const docRef = doc(db, "notifications", notificationID);
    await updateDoc(docRef, { IsRead: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};