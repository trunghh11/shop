import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyAccount() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState({
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    profilePic: '',
    facebookLink: '',
    ratingCount: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
  userId: userData.UserID || '',
  fullName: userData.FullName || '',
  email: userData.Email || '',
  phone: userData.Phone || '',
  profilePic: userData.ProfilePic || '',
  facebookLink: userData.FacebookLink || '',
  ratingCount: parseInt(userData.RatingCount || 0),
  avgRating: parseFloat(userData.AvgRating || 0),
  className: userData.Class || '',
  role: userData.Role || '',
  isFlagged: userData.IsFlagged || false,
  totalDonation: userData["Total Donation"] || 0,
  numberOfCampaignJoined: userData.NumberOfCampaignJoined || 0,
});

          } else {
            toast.warn('No profile data found. Please update your profile.');
          }
        } catch (error) {
          toast.error('Error loading profile: ' + error.message);
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        setSaveLoading(true);
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          Email: profile.email,
          FullName: profile.fullName,
          profilePic: profile.profilePic,
          FacebookLink: profile.facebookLink,
        });
        toast.success('Profile updated successfully!');
      } catch (error) {
        toast.error('Error updating profile: ' + error.message);
        console.error('Error updating profile:', error);
      } finally {
        setSaveLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form bên trái */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              name="userId"
              value={profile.userId}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
            <input
              type="text"
              name="profilePic"
              value={profile.profilePic}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Link</label>
            <input
              type="text"
              name="facebookLink"
              value={profile.facebookLink}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Bảng đánh giá bên phải */}
        <div className="bg-white shadow-md rounded-lg p-6 h-fit">
  <h2 className="text-xl font-bold mb-4">Thông tin người dùng</h2>
  <ul className="space-y-2 text-sm text-gray-700">
    <li><strong>Class:</strong> {profile.className}</li>
    <li><strong>Role:</strong> {profile.role}</li>
    <li><strong>Số lượt đánh giá:</strong> {profile.ratingCount}</li>
    <li><strong>Điểm trung bình:</strong> {profile.ratingCount > 0 ? profile.avgRating.toFixed(2) : 'Chưa có'}</li>
    <li><strong>Số chiến dịch tham gia:</strong> {profile.numberOfCampaignJoined}</li>
    <li><strong>Tổng quyên góp:</strong> {profile.totalDonation.toLocaleString()} VND</li>
    <li><strong>Đánh dấu vi phạm:</strong> {profile.isFlagged ? '⚠️ Có' : 'Không'}</li>
    <li><strong>Facebook:</strong> {profile.facebookLink ? <a className="text-blue-600 underline" href={profile.facebookLink} target="_blank">Link</a> : 'Không có'}</li>
  </ul>
</div>

      </div>
    </div>
  );
}

export default MyAccount;
