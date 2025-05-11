import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  query,
  doc,
  getDoc,
  where,
  updateDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDocs(query(collection(db, 'users')));
        const matched = userDoc.docs.find(doc => doc.id === currentUser.uid);
        if (matched) {
          const userData = matched.data();
          setUser({ ...currentUser, ...userData });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        let allHistory = [];
        if (user) {
          const saleSnapshot = await getDocs(query(collection(db, 'saleTransactions')));
          const exchangeSnapshot = await getDocs(query(collection(db, 'exchangeTransactions')));

          const saleHistory = saleSnapshot.docs
            .map(doc => ({ id: doc.id, type: 'sale', ...doc.data() }))
            .filter(tx => tx.BuyerID === user.UserID || tx.SellerID === user.UserID);

          const exchangeHistory = exchangeSnapshot.docs
            .map(doc => ({ id: doc.id, type: 'exchange', ...doc.data() }))
            .filter(tx => tx.UserID1 === user.UserID || tx.UserID2 === user.UserID);

          allHistory = [...saleHistory, ...exchangeHistory].sort(
            (a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt)
          );
        }
        setHistory(allHistory);
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi truy vấn lịch sử giao dịch:', err);
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toLocaleString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const handleRating = async (tx) => {
        const targetUserID = tx.SellerID || tx.PosterID;

        if (!targetUserID) {
            alert('Không xác định được người nhận đánh giá.');
            return;
        }

        const input = prompt('Nhập số sao đánh giá (1–5):');
        const score = parseInt(input);
        if (isNaN(score) || score < 1 || score > 5) {
            alert('Vui lòng nhập số từ 1 đến 5.');
            return;
        }

        try {
            // 🔍 Truy vấn user có UserID = targetUserID
            const q = query(collection(db, 'users'), where('UserID', '==', targetUserID));
            const snap = await getDocs(q);

            if (snap.empty) {
            alert('Không tìm thấy người dùng có UserID này.');
            return;
            }

            const docRef = snap.docs[0].ref;
            const userData = snap.docs[0].data();

            const currentCount = userData.RatingCount || 0;
            const currentAvg = userData.AvgRating || 0;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + score) / newCount;

            await updateDoc(docRef, {
            RatingCount: newCount,
            AvgRating: parseFloat(newAvg.toFixed(2))
            });

            alert('Đánh giá thành công!');

            // Đánh dấu đã đánh giá
            const txRef = doc(db, tx.type === 'sale' ? 'saleTransactions' : 'exchangeTransactions', tx.id);
            await updateDoc(txRef, { IsRated: true });
        } catch (error) {
            console.error('Lỗi khi đánh giá:', error);
            alert('Đánh giá thất bại.');
        }
    };

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <h1 className='text-2xl font-bold mb-4'>Lịch sử giao dịch</h1>
      {loading ? (
        <p>Đang tải...</p>
      ) : user ? (
        history.length > 0 ? (
          <table className='table-auto w-full border'>
            <thead>
              <tr className='bg-gray-100'>
                <th className='border p-2'>ID</th>
                <th className='border p-2'>Loại</th>
                <th className='border p-2'>Người mua</th>
                <th className='border p-2'>Người bán</th>
                <th className='border p-2'>Sản phẩm / Đối tượng</th>
                <th className='border p-2'>Số lượng</th>
                <th className='border p-2'>Giá trị</th>
                <th className='border p-2'>Thời gian</th>
                <th className='border p-2'>Trạng thái</th>
                <th className='border p-2'>Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx, idx) => (
                <tr key={idx} className='text-center'>
                  <td className='border p-2'>{tx.id}</td>
                  <td className='border p-2 capitalize'>{tx.type}</td>
                  <td className='border p-2'>
                    {tx.BuyerID || tx.UserID1 || '-'}
                    </td>
                    <td className='border p-2'>
                    {tx.SellerID || tx.UserID2 || '-'}
                  </td>

                  <td className='border p-2'>
                    {tx.ProductID || `${tx.ProductID1} ⇄ ${tx.ProductID2}`}
                    </td>
                  <td className='border p-2'>{tx.Quantity || `${tx.Quantity1} ⇄ ${tx.Quantity2}`}</td>
                  <td className='border p-2'>{tx.Price ? `${tx.Price} VND` : '-'}</td>
                  <td className='border p-2'>{formatDate(tx.CreatedAt)}</td>
                  <td className='border p-2'>{tx.Status}</td>
                  <td className='border p-2'>
                    {tx.Status === 'completed' ? (
                      <td className='border p-2'>
                    {tx.Status === 'completed' ? (
                        tx.IsRated ? (
                        <span className='text-gray-400 italic'>Đã đánh giá</span>
                        ) : (
                        <button
                            className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded'
                            onClick={() => handleRating(tx)}
                        >
                            Đánh giá
                        </button>
                        )
                    ) : '-'}
                    </td>

                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Không có lịch sử giao dịch nào.</p>
        )
      ) : (
        <p>Vui lòng đăng nhập để xem lịch sử giao dịch.</p>
      )}
    </div>
  );
};

export default TransactionHistory;
