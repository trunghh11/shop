import { collection, doc, setDoc, getDocs, query, where, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import SaleTransaction from "../models/saleTransaction";
import { createNotification } from "./notificationsController";

/**
 * Create a new sale transaction
 * @param {Object} formData - Form data from user
 * @returns {Promise<Object>}
 */
export const createSaleTransaction = async (formData) => {
    try {
        // Tạo một document ID mới - sẽ sử dụng làm saleID
        const saleID = doc(collection(db, "saleTransactions")).id;
        console.log("Generated saleID:", saleID);
        
    // Tạo đối tượng giao dịch từ model
    const transaction = new SaleTransaction({
        CreatedAt: new Date(),
        ProductID: formData.ProductID,
        BuyerID: formData.BuyerID, 
        SellerID: formData.SellerID,
        Quantity: Number(formData.Quantity) || 0,
        Price: Number(formData.Price) || 0,
        Status: "pending"
      });

        console.log("Data being sent to Firestore:", transaction.toJSON());

        // Lưu vào Firestore với saleID làm document ID
        const docRef = doc(db, "saleTransactions", saleID);
        await setDoc(docRef, transaction.toJSON());
    
        console.log("Sale transaction created successfully with ID:", saleID);

        // Tìm uid của người mua và người bán
        const buyerQuery = query(collection(db, "users"), where("UserID", "==", formData.BuyerID));
        const sellerQuery = query(collection(db, "users"), where("UserID", "==", formData.SellerID));

        const buyerSnapshot = await getDocs(buyerQuery);
        const sellerSnapshot = await getDocs(sellerQuery);

        let buyerUid = "";
        let sellerUid = "";

        if (!buyerSnapshot.empty) {
            buyerUid = buyerSnapshot.docs[0].id;
            console.log("Found buyer UID:", buyerUid);
        } else {
            console.log("Buyer not found with UserID:", formData.BuyerID);
        }
        
        if (!sellerSnapshot.empty) {
            sellerUid = sellerSnapshot.docs[0].id;
            console.log("Found seller UID:", sellerUid);
        } else {
            console.log("Seller not found with UserID:", formData.SellerID);
        }

        // Tạo thông báo cho người mua và người bán
        if (buyerUid) {
            const notificationData = {
              Message: `Bạn đã đặt hàng sản phẩm ${formData.ProductID}.`,
              RelatedID: saleID,
              Type: "sale"
            };
            console.log("Creating buyer notification:", notificationData);
            await createNotification(buyerUid, notificationData);
        }
      
        if (sellerUid) {
            const notificationData = {
              Message: `${formData.BuyerID} đã đặt hàng sản phẩm ${formData.ProductID}.`,
              RelatedID: saleID,
              Type: "sale"
            };
            console.log("Creating seller notification:", notificationData);
            await createNotification(sellerUid, notificationData);
        }

        return {
            success: true,
            message: "Giao dịch mua bán đã được tạo thành công",
            data: {
              ...transaction.toJSON(),
              id: saleID
            }
        };
    } catch (error) {
        console.error("Error creating sale transaction:", error);
        throw error;
    }
}

/**
 * Get all sale transactions
 */
export const getSaleTransactions = async () => {
    try {
        const snapshot = await getDocs(collection(db, "saleTransactions"));
        const transactions = snapshot.docs.map(doc => {
            return SaleTransaction.fromJSON({
                ...doc.data(),
                id: doc.id  // Thêm ID của document
            });
        });
        return {
            success: true,
            count: transactions.length,
            data: transactions
        };
    } catch (error) {
        console.error("Error fetching sale transactions:", error);
        throw error;    
    }
};

/**
 * Update sale transaction status
 */
export const updateSaleTransactionStatus = async (saleId, status) => {
    try {
      const docRef = doc(db, "saleTransactions", saleId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        throw new Error("Transaction not found");
      }
      
      const transaction = SaleTransaction.fromJSON({
        ...snapshot.data()
        // Không thêm TransactionID vì model không có
      });
      
      // Cập nhật trạng thái
      await updateDoc(docRef, { Status: status });
      console.log(`Updated transaction ${saleId} status to ${status}`);
      
      // Tìm uid người mua và người bán
      const buyerQuery = query(collection(db, "users"), where("UserID", "==", transaction.BuyerID));
      const sellerQuery = query(collection(db, "users"), where("UserID", "==", transaction.SellerID));
      
      const buyerSnapshot = await getDocs(buyerQuery);
      const sellerSnapshot = await getDocs(sellerQuery);
      
      let buyerUid = "";
      let sellerUid = "";
      
      if (!buyerSnapshot.empty) {
        buyerUid = buyerSnapshot.docs[0].id;
      }
      
      if (!sellerSnapshot.empty) {
        sellerUid = sellerSnapshot.docs[0].id;
      }
      
      // Tạo thông báo phù hợp dựa trên trạng thái
      if (status === "completed") {
        // Thông báo người mua
        if (buyerUid) {
          await createNotification(buyerUid, {
            Message: `Giao dịch mua sản phẩm ${transaction.ProductID} đã hoàn thành.`,
            RelatedID: saleId,
            Type: "sale"
          });
        }
        
        // Thông báo người bán
        if (sellerUid) {
          await createNotification(sellerUid, {
            Message: `Giao dịch bán sản phẩm ${transaction.ProductID} cho ${transaction.BuyerID} đã hoàn thành.`,
            RelatedID: saleId,
            Type: "sale"
          });
        }
      } 
      else if (status === "cancelled") {
        // Thông báo người mua
        if (buyerUid) {
          await createNotification(buyerUid, {
            Message: `Giao dịch mua sản phẩm ${transaction.ProductID} đã bị hủy.`,
            RelatedID: saleId,
            Type: "sale"
          });
        }
        
        // Thông báo người bán
        if (sellerUid) {
          await createNotification(sellerUid, {
            Message: `Giao dịch bán sản phẩm ${transaction.ProductID} cho ${transaction.BuyerID} đã bị hủy.`,
            RelatedID: saleId,
            Type: "sale"
          });
        }
      }
      
      return {
        success: true,
        message: `Cập nhật trạng thái giao dịch thành ${status}`,
        data: { ...transaction, Status: status }
      };
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
};