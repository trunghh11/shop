// functions/controllers/exchangeController.js
import {collection, doc, setDoc} from "firebase/firestore";
import {getDocs, query, where} from "firebase/firestore";
import {db} from "../../firebase/config";
import ExchangeTransaction from "../models/exchangeTransaction";
import {createNotification} from "./notificationsController";
import {getDoc, updateDoc} from "firebase/firestore";

/**
 * Tạo giao dịch trao đổi mới
 * @param {Object} formData - Dữ liệu từ form người dùng
 * @return {Promise<Object>}
 */
export const createExchangeTransaction = async (formData) => {
  try {
    // 1. Kiểm tra người yêu cầu và người nhận không được giống nhau
    if (formData.User1ID === formData.User2ID) {
      throw new Error("Người gửi và người nhận yêu cầu trao đổi không thể là cùng một người");
    }
    
    // 2. Kiểm tra ProductID1 và ProductID2 không được giống nhau
    if (formData.ProductID1 === formData.ProductID2) {
      throw new Error("Không thể trao đổi cùng một sản phẩm");
    }
    
    // 3. Kiểm tra sản phẩm 1 thuộc về người dùng 1
    const product1Ref = doc(db, "products", formData.ProductID1);
    const product1Snap = await getDoc(product1Ref);
    
    if (!product1Snap.exists()) {
      throw new Error("Sản phẩm 1 không tồn tại");
    }
    
    const product1Data = product1Snap.data();
    
    // Kiểm tra product1 có PostID và lấy thông tin post
    if (!product1Data.PostID) {
      throw new Error("Sản phẩm 1 không liên kết với bài đăng nào");
    }
    
    const post1Ref = doc(db, "post", product1Data.PostID);
    const post1Snap = await getDoc(post1Ref);
    
    if (!post1Snap.exists()) {
      throw new Error("Không tìm thấy bài đăng của sản phẩm 1");
    }
    
    const post1Data = post1Snap.data();
    
    // Lấy thông tin user1 từ UserID
    const user1Query = query(collection(db, "users"), where("UserID", "==", formData.User1ID));
    const user1Snapshot = await getDocs(user1Query);
    
    if (user1Snapshot.empty) {
      throw new Error("Không tìm thấy thông tin người dùng 1");
    }
    
    const user1Data = user1Snapshot.docs[0].data();
    const user1Uid = user1Snapshot.docs[0].id;
    
    // Kiểm tra user1 có phải là người đăng sản phẩm 1 không
    if (user1Uid !== post1Data.PosterID) {
      throw new Error("Người dùng 1 không sở hữu sản phẩm 1");
    }
    
    // 4. Kiểm tra sản phẩm 2 thuộc về người dùng 2
    const product2Ref = doc(db, "products", formData.ProductID2);
    const product2Snap = await getDoc(product2Ref);
    
    if (!product2Snap.exists()) {
      throw new Error("Sản phẩm 2 không tồn tại");
    }
    
    const product2Data = product2Snap.data();
    
    // Kiểm tra product2 có PostID và lấy thông tin post
    if (!product2Data.PostID) {
      throw new Error("Sản phẩm 2 không liên kết với bài đăng nào");
    }
    
    const post2Ref = doc(db, "post", product2Data.PostID);
    const post2Snap = await getDoc(post2Ref);
    
    if (!post2Snap.exists()) {
      throw new Error("Không tìm thấy bài đăng của sản phẩm 2");
    }
    
    const post2Data = post2Snap.data();
    
    // Lấy thông tin user2 từ UserID
    const user2Query = query(collection(db, "users"), where("UserID", "==", formData.User2ID));
    const user2Snapshot = await getDocs(user2Query);
    
    if (user2Snapshot.empty) {
      throw new Error("Không tìm thấy thông tin người dùng 2");
    }
    
    const user2Data = user2Snapshot.docs[0].data();
    const user2Uid = user2Snapshot.docs[0].id;
    
    // Kiểm tra user2 có phải là người đăng sản phẩm 2 không
    if (user2Uid !== post2Data.PosterID) {
      throw new Error("Người dùng 2 không sở hữu sản phẩm 2");
    }
    
    // 5. Kiểm tra số lượng sản phẩm có đủ không
    if (product1Data.Stock < formData.Quantity1) {
      throw new Error(`Sản phẩm 1 không đủ số lượng. Chỉ còn ${product1Data.Stock} sản phẩm`);
    }
    
    if (product2Data.Stock < formData.Quantity2) {
      throw new Error(`Sản phẩm 2 không đủ số lượng. Chỉ còn ${product2Data.Stock} sản phẩm`);
    }
    
    // Tạo ID mới nếu không có
    const exchangeID = formData.ExchangeID || doc(collection(db, "exchangeTransactions")).id;

    // Tạo đối tượng giao dịch từ form data
    const transaction = new ExchangeTransaction({
      ExchangeID: exchangeID,
      CreatedAt: new Date(),
      ProductID1: formData.ProductID1,
      ProductID2: formData.ProductID2,
      Quantity1: Number(formData.Quantity1) || 0,
      Quantity2: Number(formData.Quantity2) || 0,
      User1ID: formData.User1ID,
      User2ID: formData.User2ID,
      Status: "pending",
      Type: "exchange"
    });

    console.log("Data being sent to Firestore:", transaction.toJSON());

    // Lưu vào Firestore
    const docRef = doc(db, "exchangeTransactions", exchangeID);
    await setDoc(docRef, transaction.toJSON());

    console.log("Exchange transaction created successfully:", transaction);

    // Lấy tên sản phẩm để hiển thị trong thông báo
    let product1Name = product1Data.ProductName || formData.ProductID1;
    let product2Name = product2Data.ProductName || formData.ProductID2;
    
    // Lấy tên người dùng để hiển thị trong thông báo
    let user1Name = user1Data.FullName || formData.User1ID;
    let user2Name = user2Data.FullName || formData.User2ID;

    // Gửi thông báo cho người yêu cầu (User1)
    if (user1Uid) {
      console.log("===== DEBUG createExchangeTransaction - User1 Notification =====");
      console.log("exchangeID:", exchangeID);

      const notificationData = {
        Message: `Yêu cầu trao đổi của bạn cho sản phẩm ${product1Name} đang chờ phản hồi.`,
        RelatedID: exchangeID,
        Type: "exchange"
      };

      console.log("notificationData sending:", JSON.stringify(notificationData));
      await createNotification(user1Uid, notificationData);
    }

    // Gửi thông báo cho người nhận yêu cầu (User2)
    if (user2Uid) {
      console.log("===== DEBUG createExchangeTransaction - User2 Notification =====");
      console.log("exchangeID:", exchangeID);

      const notificationData = {
        Message: `${user1Name} muốn trao đổi sản phẩm ${product1Name} với sản phẩm ${product2Name} của bạn. Vui lòng phản hồi.`,
        RelatedID: exchangeID,
        Type: "exchange"
      };

      console.log("notificationData sending:", JSON.stringify(notificationData));
      await createNotification(user2Uid, notificationData);
    }

    return {
      success: true,
      message: "Yêu cầu trao đổi đã được tạo thành công",
      data: transaction,
    };
  } catch (error) {
    console.error("Error creating exchange transaction:", error);
    throw error;
  }
};

/**
 * Lấy tất cả giao dịch trao đổi
 * @return {Promise<Object>}
 */
export const getExchangeTransactions = async () => {
  try {
    const snapshot = await getDocs(collection(db, "exchangeTransactions"));
    const exchanges = snapshot.docs.map((doc) => {
      return ExchangeTransaction.fromJSON({
        ExchangeID: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      count: exchanges.length,
      data: exchanges,
    };
  } catch (error) {
    console.error("Error fetching exchange transactions:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một giao dịch trao đổi
 * @param {string} exchangeID - ID của giao dịch trao đổi
 * @return {Promise<Object>}
 */
export const getExchangeTransactionById = async (exchangeID) => {
  try {
    const docRef = doc(db, "exchangeTransactions", exchangeID);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error("Không tìm thấy giao dịch trao đổi");
    }
    
    const exchangeData = ExchangeTransaction.fromJSON({
      ExchangeID: snapshot.id,
      ...snapshot.data()
    });
    
    return {
      success: true,
      data: exchangeData
    };
  } catch (error) {
    console.error("Error fetching exchange transaction:", error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái giao dịch trao đổi
 * @param {string} exchangeID - ID của giao dịch trao đổi
 * @param {string} status - Trạng thái mới (accepted/rejected)
 * @return {Promise<Object>}
 */
export const updateExchangeTransactionStatus = async (exchangeID, status) => {
  try {
    const docRef = doc(db, "exchangeTransactions", exchangeID);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Không tìm thấy giao dịch");
    }

    const transaction = ExchangeTransaction.fromJSON({
      ExchangeID: snapshot.id,
      ...snapshot.data(),
    });

    // Cập nhật trạng thái giao dịch trong database
    await updateDoc(docRef, {Status: status});
    console.log(`Đã cập nhật trạng thái giao dịch ${exchangeID} thành ${status}`);

    // Truy vấn thông tin người dùng
    const user1Query = query(collection(db, "users"), where("UserID", "==", transaction.User1ID));
    const user2Query = query(collection(db, "users"), where("UserID", "==", transaction.User2ID));
    
    const user1QuerySnapshot = await getDocs(user1Query);
    const user2QuerySnapshot = await getDocs(user2Query);
    
    // Khởi tạo biến để lưu thông tin
    let user1Uid = "";
    let user2Uid = "";
    let user1Name = transaction.User1ID;
    let user2Name = transaction.User2ID;
    
    // Lấy thông tin người dùng 1
    if (!user1QuerySnapshot.empty) {
      const user1Doc = user1QuerySnapshot.docs[0];
      const user1Data = user1Doc.data();
      user1Uid = user1Doc.id;
      user1Name = user1Data.FullName || transaction.User1ID;
    }
    
    // Lấy thông tin người dùng 2
    if (!user2QuerySnapshot.empty) {
      const user2Doc = user2QuerySnapshot.docs[0];
      const user2Data = user2Doc.data();
      user2Uid = user2Doc.id;
      user2Name = user2Data.FullName || transaction.User2ID;
    }
    
    // Truy vấn thông tin sản phẩm
    const product1Ref = doc(db, "products", transaction.ProductID1);
    const product2Ref = doc(db, "products", transaction.ProductID2);
    
    const product1Snap = await getDoc(product1Ref);
    const product2Snap = await getDoc(product2Ref);
    
    let product1Name = transaction.ProductID1;
    let product2Name = transaction.ProductID2;
    
    // Lấy tên sản phẩm 1
    if (product1Snap.exists()) {
      const product1Data = product1Snap.data();
      product1Name = product1Data.ProductName || transaction.ProductID1;
    }
    
    // Lấy tên sản phẩm 2
    if (product2Snap.exists()) {
      const product2Data = product2Snap.data();
      product2Name = product2Data.ProductName || transaction.ProductID2;
    }

    // Tạo thông báo cho cả hai người dùng dựa trên kết quả
    if (status === "accepted") {
      // Tạo thông báo cho người yêu cầu (User1)
      if (user1Uid) {
        await createNotification(user1Uid, {
          Message: `Yêu cầu trao đổi sản phẩm "${product1Name}" của bạn đã được chấp nhận.`,
          RelatedID: exchangeID,
          Type: "exchange",
        });
        console.log("Đã tạo thông báo chấp nhận cho người yêu cầu");
      }

      // Tạo thông báo cho người nhận yêu cầu (User2)
      if (user2Uid) {
        await createNotification(user2Uid, {
          Message: `Bạn đã chấp nhận yêu cầu trao đổi sản phẩm "${product2Name}" với ${user1Name}.`,
          RelatedID: exchangeID,
          Type: "exchange",
        });
        console.log("Đã tạo thông báo chấp nhận cho người nhận yêu cầu");
      }
      
      // Khi chấp nhận, cần cập nhật số lượng tồn kho của cả hai sản phẩm
      if (product1Snap.exists() && product2Snap.exists()) {
        // Cập nhật số lượng sản phẩm 1
        await updateDoc(product1Ref, {
          Stock: Math.max(0, product1Snap.data().Stock - transaction.Quantity1)
        });
        
        // Cập nhật số lượng sản phẩm 2
        await updateDoc(product2Ref, {
          Stock: Math.max(0, product2Snap.data().Stock - transaction.Quantity2)
        });
        
        console.log("Đã cập nhật số lượng tồn kho của cả hai sản phẩm");
      }
    } else if (status === "rejected") {
      // Tạo thông báo cho người yêu cầu (User1)
      if (user1Uid) {
        await createNotification(user1Uid, {
          Message: `Yêu cầu trao đổi sản phẩm "${product1Name}" của bạn đã bị từ chối.`,
          RelatedID: exchangeID,
          Type: "exchange",
        });
        console.log("Đã tạo thông báo từ chối cho người yêu cầu");
      }

      // Tạo thông báo cho người nhận yêu cầu (User2)
      if (user2Uid) {
        await createNotification(user2Uid, {
          Message: `Bạn đã từ chối yêu cầu trao đổi sản phẩm "${product2Name}" với ${user1Name}.`,
          RelatedID: exchangeID,
          Type: "exchange",
        });
        console.log("Đã tạo thông báo từ chối cho người nhận yêu cầu");
      }
    }

    return {
      success: true,
      message: `Trạng thái giao dịch đã được cập nhật thành ${status}`,
      data: {...transaction, Status: status},
    };
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};

/**
 * Lấy danh sách giao dịch theo UserID
 * @param {string} userID - ID của người dùng
 * @return {Promise<Object>}
 */
export const getExchangeTransactionsByUserId = async (userID) => {
  try {
    // Tìm tất cả giao dịch mà người dùng tham gia (cả người yêu cầu và người nhận)
    const query1 = query(collection(db, "exchangeTransactions"), where("User1ID", "==", userID));
    const query2 = query(collection(db, "exchangeTransactions"), where("User2ID", "==", userID));
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(query1),
      getDocs(query2)
    ]);
    
    // Kết hợp kết quả và loại bỏ trùng lặp
    const exchanges = [];
    const exchangeIds = new Set();
    
    snapshot1.docs.forEach(doc => {
      if (!exchangeIds.has(doc.id)) {
        exchangeIds.add(doc.id);
        exchanges.push(ExchangeTransaction.fromJSON({
          ExchangeID: doc.id,
          ...doc.data()
        }));
      }
    });
    
    snapshot2.docs.forEach(doc => {
      if (!exchangeIds.has(doc.id)) {
        exchangeIds.add(doc.id);
        exchanges.push(ExchangeTransaction.fromJSON({
          ExchangeID: doc.id,
          ...doc.data()
        }));
      }
    });
    
    return {
      success: true,
      count: exchanges.length,
      data: exchanges
    };
  } catch (error) {
    console.error("Error fetching user's exchange transactions:", error);
    throw error;
  }
};

