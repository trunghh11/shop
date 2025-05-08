import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // To get id from URL
import { db } from "../firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { VietQR } from "vietqr"; 

const FundDetailPage = () => {
  const { id } = useParams(); // Get id from URL
  const [fund, setFund] = useState(null);
  const [studentId, setStudentId] = useState(""); // Student ID input
  const [donationAmount, setDonationAmount] = useState(""); // Donation amount input
  const [qrCodeBase64, setQrCodeBase64] = useState(""); // Store QR code base64 image
  const [showQRCode, setShowQRCode] = useState(false); // To show QR Code
  const [transferProof, setTransferProof] = useState(null); // Store transfer proof image
  const [showTransferProof, setShowTransferProof] = useState(false); // To show transfer proof
  const [isSubmitting, setIsSubmitting] = useState(false); // Disable form during submission

  // VietQR setup (using the template you provided)
  const vietQR = new VietQR({
    clientID: 'de8a0804-a76d-41e5-8ad6-31503ce7d5f4',
    apiKey: '17c29f09-4ea2-4417-b9c2-7f020d35de42',
  });

  useEffect(() => {
    // Fetch fund details based on id from URL
    const fetchFundDetail = async () => {
      try {
        const fundRef = doc(db, "fund", id);
        const fundSnap = await getDoc(fundRef);

        if (fundSnap.exists()) {
          setFund(fundSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      }
    };

    fetchFundDetail();
  }, [id]);

  const generateQRCode = async () => {
    if (studentId && donationAmount) {
      try {
        const result = await vietQR.genQRCodeBase64({
          bank: '970415', // Bank Code (This needs to be the correct bank code)
          accountName: 'Quy Vac Xin Phong Chong COVID', // Account name
          accountNumber: '113366668888', // Account number
          amount: donationAmount, // Donation amount
          memo: `Mã học sinh: ${studentId}`, // Memo includes the student ID
          template: 'compact', // Template style
        });

        setQrCodeBase64(result.qrCodeBase64); // Set the QR code base64 result
        setShowQRCode(true); // Show QR code once generated
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }
  };

  const handleTransferProofUpload = (event) => {
    const file = event.target.files[0]; // Get the first file selected
    if (file) {
      setTransferProof(URL.createObjectURL(file)); // Store image preview URL
      setShowTransferProof(true); // Display the uploaded image preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get the data from form fields
    const donationData = {
      Amount: donationAmount,
      DonorID: studentId, // Student ID as donor ID
      FundID: id,
      Proof: transferProof, // Image URL of transfer proof
      Timestamp: new Date(),
      Verified: false, // Initially false, can be updated manually later
    };

    try {
      // Save the donation data to Firestore in the "fund_transaction" collection
      const docRef = await addDoc(collection(db, "fund_transaction"), donationData);
      console.log("Donation added with ID: ", docRef.id);
      alert("Donation added successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Something went wrong. Please try again.");
    }

    setIsSubmitting(false); // Enable the form again after submission
  };

  // Display loading message while the data is being fetched
  if (!fund) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen px-6 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-center">{fund.FundName}</h1>
      <div className="max-w-4xl mx-auto mt-6">
        <img
          className="w-full h-96 object-cover rounded-lg mb-6"
          src={fund.QRCode || "https://via.placeholder.com/1200x600"}
          alt={fund.FundName}
        />
        <p className="text-lg text-gray-700 mb-6">{fund.Description}</p>
        <p className="text-md text-gray-600">Kết thúc: {new Date(fund.EndDate.seconds * 1000).toLocaleDateString()}</p>
        <div className="mt-4">
          <div className="bg-gray-200 h-2 rounded-full">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100}%`,
              }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {Math.round(((fund.CurrentAmount || 0) / (fund.TargetAmount || 1)) * 100)}% mục tiêu đã hoàn thành
          </p>
        </div>
      </div>

      {/* Form for donation */}
      <form
        onSubmit={handleSubmit} // Handle the form submission
        className="mt-6 max-w-4xl mx-auto"
      >
        <div className="mb-4">
          <label htmlFor="studentId" className="block text-gray-700 font-semibold">
            Mã học sinh:
          </label>
          <input
            type="text"
            id="studentId"
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onBlur={generateQRCode} // Generate QR code when focus is lost from input field
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="donationAmount" className="block text-gray-700 font-semibold">
            Số tiền đóng góp:
          </label>
          <input
            type="number"
            id="donationAmount"
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            onBlur={generateQRCode} // Generate QR code when focus is lost from input field
            required
          />
        </div>

        {showQRCode && qrCodeBase64 && (
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Mã QR của bạn</h2>
            <img src={qrCodeBase64} alt="QR Code" className="mx-auto" />
            <p className="text-lg text-gray-700 mt-4">
              Quỹ ID: {studentId} - TP Bank: 27316062004
            </p>
          </div>
        )}

        {/* Upload Proof of Transfer */}
        <div className="mt-6">
          <label htmlFor="transferProof" className="block text-gray-700 font-semibold mb-2">
            Tải ảnh minh chứng chuyển khoản:
          </label>
          <input
            type="file"
            id="transferProof"
            accept="image/*"
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={handleTransferProofUpload}
            required
          />
        </div>

        {/* Display transfer proof image after upload */}
        {showTransferProof && transferProof && (
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ảnh Minh Chứng Chuyển Khoản</h2>
            <img src={transferProof} alt="Transfer Proof" className="mx-auto w-80 h-80 object-cover rounded-lg" />
          </div>
        )}

        {/* Donation Button */}
        <div className="mt-6 text-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300"
            disabled={isSubmitting} // Disable button during submission
          >
            {isSubmitting ? "Đang xử lý..." : "Quyên Góp Ngay"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FundDetailPage;
