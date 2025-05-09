// functions/controllers/exchangeController.js
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import ExchangeTransaction from "../models/exchangeTransaction";
import { createNotification } from "./notificationsController";
import { getDoc, updateDoc } from "firebase/firestore";
/**
 * Tạo giao dịch trao đổi mới
 * @param {Object} formData - Dữ liệu từ form người dùng
 * @returns {Promise<Object>}
 */
export const createExchangeTransaction = async (formData) => {
  try {
    // Tạo ID mới nếu không có
    const exchangeID = formData.ExchangeID || doc(collection(db, "exchangeTransactions")).id;
    
    // Tạo đối tượng giao dịch từ form data
    const transaction = new ExchangeTransaction({
      // ExchangeID: exchangeID,

      ExchangeID: formData.ExchangeID,

      CreatedAt: new Date(),
      ProductID1: formData.ProductID1,
      ProductID2: formData.ProductID2,
      Quantity1: formData.Quantity1,
      Quantity2: formData.Quantity2,
      User1ID: formData.User1ID,
      User2ID: formData.User2ID,
      Status: "pending",
      Type: "exchange" // Thêm Type là "exchange"
    });

    console.log("Data being sent to Firestore:", transaction.toJSON());

    // Lưu vào Firestore
    const docRef = doc(db, "exchangeTransactions", exchangeID);
    await setDoc(docRef, transaction.toJSON());

    console.log("Exchange transaction created successfully:", transaction);
    
// Trước tiên, cần truy vấn uid từ Firestore dựa vào User1ID và User2ID
const queryUser1 = query(collection(db, "users"), where("UserID", "==", formData.User1ID));
const queryUser2 = query(collection(db, "users"), where("UserID", "==", formData.User2ID));

const user1Snapshot = await getDocs(queryUser1);
const user2Snapshot = await getDocs(queryUser2);

let user1Uid = "";
let user2Uid = "";

if (!user1Snapshot.empty) {
  user1Uid = user1Snapshot.docs[0].id; // Lấy uid từ document ID
}

if (!user2Snapshot.empty) {
  user2Uid = user2Snapshot.docs[0].id; // Lấy uid từ document ID
}

if (user1Uid) {
  console.log("===== DEBUG createExchangeTransaction - User1 Notification =====");
  console.log("exchangeID:", exchangeID);
  
  // Tạo đối tượng notification
  const notificationData = {
    Message: `Yêu cầu trao đổi của bạn cho sản phẩm ${formData.ProductID1} đang chờ phản hồi.`,
    RelatedID: exchangeID,
    Type: "exchange"  // Thêm Type là "exchange"
  };
  
  console.log("notificationData sending:", JSON.stringify(notificationData));
  
  await createNotification(user1Uid, notificationData);
}

if (user2Uid) {
  console.log("===== DEBUG createExchangeTransaction - User2 Notification =====");
  console.log("exchangeID:", exchangeID);
  
  // Tạo đối tượng notification
  const notificationData = {
    Message: `${formData.User1ID} muốn trao đổi sản phẩm ${formData.ProductID1} với sản phẩm ${formData.ProductID2} của bạn. Vui lòng phản hồi.`,
    RelatedID: exchangeID,
    Type: "exchange"  // Thêm Type là "exchange"
  };
  
  console.log("notificationData sending:", JSON.stringify(notificationData));
  
  await createNotification(user2Uid, notificationData);
}

    return {
      success: true,
      message: "Exchange transaction created successfully",
      data: transaction
    };
  } catch (error) {
    console.error("Error creating exchange transaction:", error);
    throw error;
  }
};

/**
 * Lấy tất cả giao dịch trao đổi
 * @returns {Promise<Object>}
 */
export const getExchangeTransactions = async () => {
  try {
    const snapshot = await getDocs(collection(db, "exchangeTransactions"));
    const exchanges = snapshot.docs.map(doc => {
      return ExchangeTransaction.fromJSON({ 
        ExchangeID: doc.id, 
        ...doc.data() 
      });
    });
    
    return {
      success: true,
      count: exchanges.length,
      data: exchanges
    };
  } catch (error) {
    console.error("Error fetching exchange transactions:", error);
    throw error;
  }
};

export const updateExchangeTransactionStatus = async (exchangeID, status) => {
  try {
    const docRef = doc(db, "exchangeTransactions", exchangeID);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error("Không tìm thấy giao dịch");
    }
    
    const transaction = ExchangeTransaction.fromJSON({
      ExchangeID: snapshot.id,
      ...snapshot.data()
    });
    
    // Cập nhật trạng thái giao dịch trong database
    await updateDoc(docRef, { Status: status });
    console.log(`Đã cập nhật trạng thái giao dịch ${exchangeID} thành ${status}`);
    
    // Tìm uid của người dùng từ User1ID
    const user1Query = query(collection(db, "users"), where("UserID", "==", transaction.User1ID));
    const user1QuerySnapshot = await getDocs(user1Query);
    let user1Uid = "";
    if (!user1QuerySnapshot.empty) {
      user1Uid = user1QuerySnapshot.docs[0].id;
    }

    // Tìm uid của người dùng từ User2ID 
    const user2Query = query(collection(db, "users"), where("UserID", "==", transaction.User2ID));
    const user2QuerySnapshot = await getDocs(user2Query);
    let user2Uid = "";
    if (!user2QuerySnapshot.empty) {
      user2Uid = user2QuerySnapshot.docs[0].id;
    }
    
    // Tạo thông báo cho cả hai người dùng dựa trên kết quả
    if (status === "accepted") {
      // Tạo thông báo cho người yêu cầu (User1)
      if (user1Uid) {
        await createNotification(user1Uid, {
          Message: `Yêu cầu trao đổi sản phẩm ${transaction.ProductID1} của bạn đã được chấp nhận.`,
          RelatedID: exchangeID,
          Type: "exchange"  // Thêm Type là "exchange"
        });
        console.log("Đã tạo thông báo chấp nhận cho người yêu cầu");
      }
      
      // Tạo thông báo cho người nhận yêu cầu (User2)
      if (user2Uid) {
        await createNotification(user2Uid, {
          Message: `Bạn đã chấp nhận yêu cầu trao đổi sản phẩm ${transaction.ProductID2} với ${transaction.User1ID}.`,
          RelatedID: exchangeID,
          Type: "exchange"  // Thêm Type là "exchange"
        });
        console.log("Đã tạo thông báo chấp nhận cho người nhận yêu cầu");
      }
    } 
    else if (status === "rejected") {
      // Tạo thông báo cho người yêu cầu (User1)
      if (user1Uid) {
        await createNotification(user1Uid, {
          Message: `Yêu cầu trao đổi sản phẩm ${transaction.ProductID1} của bạn đã bị từ chối.`,
          RelatedID: exchangeID,
          Type: "exchange"  // Thêm Type là "exchange"
        });
        console.log("Đã tạo thông báo từ chối cho người yêu cầu");
      }
      
      // Tạo thông báo cho người nhận yêu cầu (User2)
      if (user2Uid) {
        await createNotification(user2Uid, {
          Message: `Bạn đã từ chối yêu cầu trao đổi sản phẩm ${transaction.ProductID2} với ${transaction.User1ID}.`,
          RelatedID: exchangeID,
          Type: "exchange"  // Thêm Type là "exchange"
        });
        console.log("Đã tạo thông báo từ chối cho người nhận yêu cầu");
      }
    }
    
    return {
      success: true,
      message: `Trạng thái giao dịch đã được cập nhật thành ${status}`,
      data: { ...transaction, Status: status }
    };
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};

