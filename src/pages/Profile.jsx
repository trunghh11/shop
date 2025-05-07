import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyAccount() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState({
    userId: '4',
    fullName: '',
    email: '',
    phone: '',
    profilePic: '',
    facebookLink: '',
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
    </div>
  );
}

export default MyAccount;
