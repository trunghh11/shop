import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp  // Thêm serverTimestamp để đảm bảo định dạng thời gian chính xác
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const FundDetailPage = () => {
  const { fundId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [transferProof, setTransferProof] = useState(null);
  const [transferProofFile, setTransferProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [relatedTransactions, setRelatedTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  // Debugging - Log params để xác nhận ID đúng
  console.log("Fund ID from URL:", fundId);

  useEffect(() => {
    const fetchFundRelatedData = async () => {
      try {
        // Lấy danh sách các quỹ liên quan - Chỉ cần lấy 3 quỹ gần nhất
        
      } catch (error) {
        console.error("Error fetching related funds:", error);
      }
    }
    fetchFundRelatedData();
  }, []);

  useEffect(() => {
    const fetchFundDetail = async () => {
      if (!fundId) {
        console.error("Fund ID is undefined or null");
        setError("Không tìm thấy ID của quỹ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching fund with ID:", fundId);

        // Lấy thông tin của quỹ - Sử dụng try/catch riêng để debug
        try {
          // Quan trọng: Truy vấn trực tiếp document theo ID document từ URL
          const fundRef = doc(db, "fund", fundId);
          console.log("Querying document with ID:", fundId);
          const fundSnap = await getDoc(fundRef);

          console.log("Fund document exists:", fundSnap.exists());

          if (fundSnap.exists()) {
            const fundData = {
              id: fundSnap.id,
              ...fundSnap.data()
            };
            console.log("Fund data:", fundData);
            setFund(fundData);

            // Lấy FundID từ dữ liệu hoặc sử dụng document ID nếu không có
            // Đây là phần quan trọng: chúng ta cần FundID để truy vấn các items liên quan
            const fundID = fundData.FundID || parseInt(fundId);

            // Sau khi lấy được fund, mới truy vấn các dữ liệu liên quan
            fetchRelatedData(fundID);
          } else {
            console.error("Fund document does not exist");
            setError("Không tìm thấy thông tin quỹ với ID này");
            setLoading(false);
          }
        } catch (fundError) {
          console.error("Error fetching fund document:", fundError);
          setError(`Lỗi khi truy vấn thông tin quỹ: ${fundError.message}`);
          setLoading(false);
        }
      } catch (error) {
        console.error("General error in fetchFundDetail:", error);
        setError(`Đã xảy ra lỗi: ${error.message}`);
        setLoading(false);
      }
    };

    const fetchRelatedData = async (fundID) => {
      try {
        console.log("Fetching related data for FundID:", fundID);

        // Lấy các vật phẩm đã quyên góp liên quan đến quỹ này
        try {
          const itemsQuery = query(
            collection(db, "donated_item"),
            where("FundID", "==", fundID),
            orderBy("DonatedAt", "desc"),
            limit(6)
          );
          const itemsSnapshot = await getDocs(itemsQuery);
          const itemsData = itemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Related items:", itemsData);
          setRelatedItems(itemsData);
        } catch (itemsError) {
          console.error("Error fetching related items:", itemsError);
          // Không set lỗi chính nếu chỉ fetch items gặp vấn đề
        }

        // Lấy các giao dịch quyên góp liên quan đến quỹ này
        try {
          const transactionsQuery = query(
            collection(db, "fund_transaction"),
            where("FundID", "==", fundID),
            orderBy("Timestamp", "desc"),
            limit(10)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          const transactionsData = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Related transactions:", transactionsData);
          setRelatedTransactions(transactionsData);
        } catch (transactionsError) {
          console.error("Error fetching related transactions:", transactionsError);
          // Không set lỗi chính nếu chỉ fetch transactions gặp vấn đề
        }

        // Dừng loading sau khi tất cả dữ liệu đã được nạp
        setLoading(false);
      } catch (error) {
        console.error("Error in fetchRelatedData:", error);
        setLoading(false);
      }
    };

    fetchFundDetail();
  }, [fundId]);

  const handleTransferProofUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setTransferProofFile(file);
      setTransferProof(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!auth.currentUser) {
      alert("Vui lòng đăng nhập để quyên góp");
      navigate("/login");
      return;
    }

    if (!donationAmount || !transferProofFile) {
      alert("Vui lòng nhập số tiền quyên góp và tải lên minh chứng chuyển khoản");
      return;
    }

    setIsSubmitting(true);

    try {
      // Sử dụng thông tin quỹ đã fetch
      if (!fund) {
        throw new Error("Không tìm thấy thông tin quỹ");
      }

      // Chuẩn bị dữ liệu giao dịch - Sử dụng FundID từ dữ liệu hoặc document ID
      const donationData = {
        Amount: Number(donationAmount),
        DonorID: auth.currentUser.uid,
        FundID: fund.FundID || parseInt(fundId), // Sử dụng FundID từ dữ liệu hoặc document ID
        ProofURL: transferProof,
        Timestamp: serverTimestamp(),
        IsVerified: false
      };

      console.log("Submitting donation data:", donationData);

      // Lưu giao dịch vào collection "fund_transaction"
      const docRef = await addDoc(collection(db, "fund_transaction"), donationData);
      console.log("Donation added with ID: ", docRef.id);

      // Hiển thị thông báo thành công
      alert("Cảm ơn bạn đã quyên góp! Giao dịch của bạn sẽ được xác minh trong thời gian sớm nhất.");

      // Reset form
      setDonationAmount("");
      setTransferProof(null);
      setTransferProofFile(null);

      // Làm mới dữ liệu giao dịch
      try {
        const transactionsQuery = query(
          collection(db, "fund_transaction"),
          where("FundID", "==", fund.FundID || parseInt(fundId)),
          orderBy("Timestamp", "desc"),
          limit(10)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRelatedTransactions(transactionsData);
      } catch (refreshError) {
        console.error("Error refreshing transactions:", refreshError);
      }

    } catch (error) {
      console.error("Error adding document: ", error);
      alert(`Đã xảy ra lỗi khi xử lý giao dịch: ${error.message}. Vui lòng thử lại sau.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date - Cải thiện xử lý lỗi
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      // Xử lý cả trường hợp timestamp là Firestore Timestamp hoặc JS Date
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('vi-VN');
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('vi-VN');
      } else {
        return "N/A";
      }
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return "N/A";
    }
  };

  // Format currency 
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0 VNĐ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Calculate progress percentage - Cải thiện xử lý lỗi
  const calculateProgress = (current, target) => {
    if (!current || !target || target === 0) return 0;
    const percentage = (current / target) * 100;
    return Math.min(percentage, 100).toFixed(0);
  };

  // Hiển thị fallback khi lỗi
  const renderFallbackFund = () => {
    return {
      FundName: "Quỹ từ thiện",
      Type: "Chưa phân loại",
      Status: "Đang diễn ra",
      StartDate: new Date(),
      EndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày từ hiện tại
      CurrentAmount: 0,
      TargetAmount: 100000000,
      BannerURL: "https://via.placeholder.com/500x300?text=Default+Banner",
      Description: "Đang cập nhật thông tin..."
    };
  };

  // Hiển thị loading spinner
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin quỹ...</p>
      </div>
    );
  }

  // Hiển thị thông báo lỗi với nút thử lại
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mt-2">Đã xảy ra lỗi khi tải dữ liệu</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sử dụng dữ liệu thực hoặc fallback nếu không có
  const displayFund = fund || renderFallbackFund();

  return (
    <div className="bg-gray-100 min-h-screen px-6 py-12">
      {/* Header Section */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img
              className="h-48 w-full object-cover md:w-64 md:h-full"
              src={displayFund.BannerURL || "https://via.placeholder.com/500x300?text=Fund+Banner"}
              alt={displayFund.FundName}
            />
          </div>
          <div className="p-8 w-full">
            <div className="flex justify-between items-start">
              <div>
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                  {displayFund.Type || "Quỹ từ thiện"}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{displayFund.FundName}</h1>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                  {displayFund.Status || "Đang diễn ra"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Bắt đầu: {formatDate(displayFund.StartDate)}</p>
                <p className="text-sm text-gray-600">Kết thúc: {formatDate(displayFund.EndDate)}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Tiến độ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {calculateProgress(displayFund.CurrentAmount, displayFund.TargetAmount)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${calculateProgress(displayFund.CurrentAmount, displayFund.TargetAmount)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Đã quyên góp: {formatCurrency(displayFund.CurrentAmount || 0)}</span>
                  <span className="text-sm text-gray-600">Mục tiêu: {formatCurrency(displayFund.TargetAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto mt-8">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            className={`py-3 px-6 whitespace-nowrap ${activeTab === "info"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin chi tiết
          </button>
          <button
            className={`py-3 px-6 whitespace-nowrap ${activeTab === "items"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab("items")}
          >
            Vật phẩm quyên góp
          </button>
          <button
            className={`py-3 px-6 whitespace-nowrap ${activeTab === "transactions"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab("transactions")}
          >
            Giao dịch quyên góp
          </button>
          <button
            className={`py-3 px-6 whitespace-nowrap ${activeTab === "donate"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab("donate")}
          >
            Quyên góp ngay
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="max-w-5xl mx-auto mt-6 bg-white rounded-xl shadow-md p-6">
        {/* Information Tab */}
        {activeTab === "info" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin chi tiết</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                {displayFund.Description ||
                  `Quỹ ${displayFund.FundName} được thành lập nhằm mục đích hỗ trợ các hoạt động từ thiện và cộng đồng. 
                Chúng tôi mong muốn sẽ đạt được mục tiêu ${formatCurrency(displayFund.TargetAmount)} để triển khai 
                các hoạt động thiết thực, góp phần xây dựng một cộng đồng tốt đẹp hơn.`}
              </p>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Thông tin liên hệ</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700">Để biết thêm thông tin chi tiết, vui lòng liên hệ với chúng tôi qua:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li className="text-gray-700">Email: support@quytuthien.vn</li>
                    <li className="text-gray-700">Hotline: 1900 1234</li>
                    <li className="text-gray-700">Văn phòng: 123 Đường ABC, Quận XYZ, Hà Nội</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === "items" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vật phẩm quyên góp</h2>
            {relatedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <img
                      className="w-full h-48 object-cover"
                      src={item.PhotoURL || "https://via.placeholder.com/300x200?text=Item+Photo"}
                      alt={item.ItemCategory}
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.ItemCategory}</h3>
                      <p className="text-sm text-gray-600 mt-1">Số lượng: {item.Quantity}</p>
                      <p className="text-sm text-gray-600">Ngày quyên góp: {formatDate(item.DonatedAt)}</p>
                      <div className="mt-3 flex justify-end">
                        <button
                          className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                          onClick={() => navigate(`/item-detail-page/${item.id}`)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Chưa có vật phẩm nào được quyên góp cho quỹ này</p>
                <button
                  className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition"
                  onClick={() => setActiveTab("donate")}
                >
                  Quyên góp ngay
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giao dịch quyên góp</h2>
            {auth.currentUser ? (
              relatedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">ID Giao dịch</th>
                        <th className="py-3 px-6 text-left">Ngày giao dịch</th>
                        <th className="py-3 px-6 text-right">Số tiền</th>
                        <th className="py-3 px-6 text-center">Trạng thái</th>
                        <th className="py-3 px-6 text-center">Minh chứng</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {relatedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-left">
                            {transaction.FundTransactionID || "GD-" + transaction.id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-6 text-left">{formatDate(transaction.Timestamp)}</td>
                          <td className="py-3 px-6 text-right font-semibold text-green-600">
                            {formatCurrency(transaction.Amount)}
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${transaction.IsVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                              }`}>
                              {transaction.IsVerified ? "Đã xác minh" : "Chờ xác minh"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            {transaction.ProofURL ? (
                              <button
                                className="text-blue-500 hover:text-blue-700"
                                onClick={() => window.open(transaction.ProofURL, '_blank')}
                              >
                                Xem
                              </button>
                            ) : (
                              <span className="text-gray-400">Không có</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Chưa có giao dịch nào được thực hiện cho quỹ này</p>
                  <button
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                    onClick={() => setActiveTab("donate")}
                  >
                    Quyên góp ngay
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Vui lòng đăng nhập để xem giao dịch quyên góp</p>
                <button
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        )}

        {/* Donate Tab */}
        {activeTab === "donate" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quyên góp cho quỹ</h2>
            {auth.currentUser ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="donationAmount" className="block text-gray-700 font-medium mb-2">
                    Số tiền quyên góp
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="donationAmount"
                      className="w-full p-3 border border-gray-300 rounded-lg pl-10"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      min="1000"
                      required
                      placeholder="Nhập số tiền quyên góp"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₫</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Số tiền tối thiểu 1.000 VNĐ</p>
                </div>

                <div>
                  <label htmlFor="transferInfo" className="block text-gray-700 font-medium mb-2">
                    Thông tin chuyển khoản
                  </label>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">Vui lòng chuyển khoản theo thông tin dưới đây:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li className="text-gray-700"><strong>Ngân hàng:</strong> TP Bank</li>
                      <li className="text-gray-700"><strong>Số tài khoản:</strong> 27316062004</li>
                      <li className="text-gray-700"><strong>Chủ tài khoản:</strong> Quỹ từ thiện XYZ</li>
                      <li className="text-gray-700"><strong>Nội dung CK:</strong> {displayFund.FundName} - {auth.currentUser.uid}</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="transferProof" className="block text-gray-700 font-medium mb-2">
                    Minh chứng chuyển khoản
                  </label>
                  <input
                    type="file"
                    id="transferProof"
                    accept="image/*"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    onChange={handleTransferProofUpload}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Tải lên ảnh chụp màn hình xác nhận chuyển khoản</p>
                </div>

                {transferProof && (
                  <div className="mt-4">
                    <p className="text-gray-700 font-medium mb-2">Xem trước ảnh minh chứng:</p>
                    <img
                      src={transferProof}
                      alt="Proof Preview"
                      className="w-full max-h-64 object-contain border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    className="bg-green-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận quyên góp"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Vui lòng đăng nhập để quyên góp</p>
                <button
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Funds Section */}
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Các quỹ liên quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder for related funds - in a real app, you would fetch related funds */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <img
              className="h-48 w-full object-cover"
              src="https://via.placeholder.com/300x200?text=Related+Fund+1"
              alt="Related Fund 1"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Quỹ học bổng cho học sinh</h3>
              <p className="text-sm text-gray-600 mt-1">Kết thúc: 31/12/2025</p>
              <div className="mt-3">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>75% mục tiêu</span>
                  <span>45.000.000 / 60.000.000 VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <img
              className="h-48 w-full object-cover"
              src="https://via.placeholder.com/300x200?text=Related+Fund+2"
              alt="Related Fund 2"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Xây dựng trường học vùng cao</h3>
              <p className="text-sm text-gray-600 mt-1">Kết thúc: 30/06/2025</p>
              <div className="mt-3">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full w-1/2"></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>50% mục tiêu</span>
                  <span>50.000.000 / 100.000.000 VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <img
              className="h-48 w-full object-cover"
              src="https://via.placeholder.com/300x200?text=Related+Fund+3"
              alt="Related Fund 3"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">Hỗ trợ trẻ em khuyết tật</h3>
              <p className="text-sm text-gray-600 mt-1">Kết thúc: 15/09/2025</p>
              <div className="mt-3">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full w-1/4"></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>25% mục tiêu</span>
                  <span>20.000.000 / 80.000.000 VNĐ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto mt-12 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-md overflow-hidden">
        <div className="p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Chung tay quyên góp ngay hôm nay</h2>
          <p className="mb-6">
            Mỗi sự đóng góp của bạn, dù nhỏ hay lớn, đều có thể tạo nên những thay đổi tích cực cho cộng đồng
          </p>
          <button
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
            onClick={() => setActiveTab("donate")}
          >
            Quyên góp ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundDetailPage;