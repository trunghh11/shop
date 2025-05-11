import {collection, doc, setDoc, getDocs, query, where, getDoc, updateDoc} from "firebase/firestore";
import {db} from "../../firebase/config";
import SaleTransaction from "../models/saleTransaction";
import {createNotification} from "./notificationsController";
export const createSaleTransaction = async (formData) => {
  try {
    // Kiểm tra người mua và người bán không được giống nhau
    if (formData.BuyerID === formData.SellerID) {
      throw new Error("Người mua và người bán không thể là cùng một người");
    }
    

    // Kiểm tra sản phẩm thuộc về người bán
    const productRef = doc(db, "products", formData.ProductID);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error("Sản phẩm không tồn tại");
    }
    
    const productData = productSnap.data();
    

        // THÊM KIỂM TRA SỐ LƯỢNG TỒN KHO
    const requestedQuantity = Number(formData.Quantity) || 0;
    const availableStock = Number(productData.Stock) || 0;
    
    if (requestedQuantity > availableStock) {
      throw new Error(`Không đủ số lượng sản phẩm. Hiện chỉ còn ${availableStock} sản phẩm trong kho.`);
    }

    
    // Kiểm tra sản phẩm có PostID
    if (!productData.PostID) {
      throw new Error("Sản phẩm không liên kết với bài đăng nào");
    }
    
    // Kiểm tra bài đăng thuộc về người bán
    const postRef = doc(db, "post", productData.PostID);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error("Bài đăng không tồn tại");
    }
    
    const postData = postSnap.data();
    
    // Lấy thông tin UserID của người bán từ UID
    const sellerRef = doc(db, "users", formData.SellerID);
    const sellerSnap = await getDoc(sellerRef);
    
    if (!sellerSnap.exists()) {
      throw new Error("Không tìm thấy thông tin người bán");
    }
    
    const sellerData = sellerSnap.data();
    
    // So sánh UserID của người bán với PosterID của bài đăng
    if (formData.SellerID !== postData.PosterID) {
      throw new Error("Bạn chỉ có thể bán sản phẩm do chính mình đăng");
    }
    
    

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
      Status: "pending",
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
    let buyerName = formData.BuyerID; 
    let sellerName = formData.SellerID; 

    if (!buyerSnapshot.empty) {
      const buyerData = buyerSnapshot.docs[0].data();
      buyerUid = buyerSnapshot.docs[0].id;
      buyerName =  buyerData.FullName;
      console.log("Found buyer UID:", buyerUid);
    } else {
      console.log("Buyer not found with UserID:", formData.BuyerID);
    }

    if (!sellerSnapshot.empty) {
      const sellerData = sellerSnapshot.docs[0].data();
      sellerUid = sellerSnapshot.docs[0].id;
      sellerName = sellerData.FullName || formData.SellerID;
      console.log("Found seller UID:", sellerUid);
    } else {
      console.log("Seller not found with UserID:", formData.SellerID);
    }

    // Truy vấn thông tin sản phẩm
    let productName = formData.ProductID; 

    if (productSnap.exists()) {
      const productData = productSnap.data();
      productName = productData.ProductName || formData.ProductID;
    }

    // Tạo thông báo cho người mua và người bán
    if (buyerUid) {
      const notificationData = {
        Message: `Bạn đã đặt hàng sản phẩm "${productName}".`,
        RelatedID: saleID,
        Type: "sale",
      };
      console.log("Creating buyer notification:", notificationData);
      await createNotification(buyerUid, notificationData);
    }

    if (sellerUid) {
      const notificationData = {
        Message: `${buyerName} đã đặt hàng sản phẩm "${productName}" của bạn.`,
        RelatedID: saleID,
        Type: "sale",
      };
      console.log("Creating seller notification:", notificationData);
      await createNotification(sellerUid, notificationData);
    }

    return {
      success: true,
      message: "Giao dịch mua bán đã được tạo thành công",
      data: {
        ...transaction.toJSON(),
        id: saleID,
      },
    };
  } catch (error) {
    console.error("Error creating sale transaction:", error);
    throw error;
  }
};

// Phần getSaleTransactions không cần thay đổi

export const updateSaleTransactionStatus = async (saleId, status) => {
  try {
    const docRef = doc(db, "saleTransactions", saleId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Transaction not found");
    }

    const transaction = SaleTransaction.fromJSON({
      ...snapshot.data(),
    });

    // Cập nhật trạng thái
    await updateDoc(docRef, {Status: status});
    console.log(`Updated transaction ${saleId} status to ${status}`);

    // Tìm uid người mua và người bán
    const buyerQuery = query(collection(db, "users"), where("UserID", "==", transaction.BuyerID));
    const sellerQuery = query(collection(db, "users"), where("UserID", "==", transaction.SellerID));

    const buyerSnapshot = await getDocs(buyerQuery);
    const sellerSnapshot = await getDocs(sellerQuery);

    let buyerUid = "";
    let sellerUid = "";
    let buyerName = transaction.BuyerID; // Mặc định là UserID
    let sellerName = transaction.SellerID; // Mặc định là UserID

    if (!buyerSnapshot.empty) {
      const buyerData = buyerSnapshot.docs[0].data();
      buyerUid = buyerSnapshot.docs[0].id;
      buyerName = buyerData.FullName || transaction.BuyerID;
    }

    if (!sellerSnapshot.empty) {
      const sellerData = sellerSnapshot.docs[0].data();
      sellerUid = sellerSnapshot.docs[0].id;
      sellerName = sellerData.FullName || transaction.SellerID;
    }

    // Truy vấn thông tin sản phẩm
    const productRef = doc(db, "products", transaction.ProductID);
    const productSnap = await getDoc(productRef);
    let productName = transaction.ProductID; // Mặc định là ProductID

    if (productSnap.exists()) {
      const productData = productSnap.data();
      productName = productData.ProductName || transaction.ProductID;
    }

    // Tạo thông báo phù hợp dựa trên trạng thái
    if (status === "completed") {
      // Thông báo người mua
      if (buyerUid) {
        await createNotification(buyerUid, {
          Message: `Giao dịch mua sản phẩm "${productName}" đã hoàn thành.`,
          RelatedID: saleId,
          Type: "sale",
        });
      }

      // Thông báo người bán
      if (sellerUid) {
        await createNotification(sellerUid, {
          Message: `Giao dịch bán sản phẩm "${productName}" cho ${buyerName} đã hoàn thành.`,
          RelatedID: saleId,
          Type: "sale",
        });
      }
        // Cập nhật số lượng tồn kho của sản phẩm
        if (productSnap.exists()) {
          const currentStock = productSnap.data().Stock;
          const quantityToDeduct = transaction.Quantity;
          
          // Đảm bảo số lượng không thể âm
          const newStock = Math.max(0, currentStock - quantityToDeduct);
          
          // Cập nhật Stock trong database
          await updateDoc(productRef, {
            Stock: newStock
          });
          console.log(`Đã cập nhật số lượng tồn kho của sản phẩm ${transaction.ProductID} từ ${currentStock} thành ${newStock}`);
      }

    } else if (status === "cancelled") {
      // Thông báo người mua
      if (buyerUid) {
        await createNotification(buyerUid, {
          Message: `Giao dịch mua sản phẩm "${productName}" đã bị hủy.`,
          RelatedID: saleId,
          Type: "sale",
        });
      }

      // Thông báo người bán
      if (sellerUid) {
        await createNotification(sellerUid, {
          Message: `Giao dịch bán sản phẩm "${productName}" cho ${buyerName} đã bị hủy.`,
          RelatedID: saleId,
          Type: "sale",
        });
      }
    }

    return {
      success: true,
      message: `Cập nhật trạng thái giao dịch thành ${status}`,
      data: {...transaction, Status: status},
    };
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};