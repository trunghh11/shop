// SignIn.jsx
import React, { useState } from 'react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function SignIn() {
  const [formData, setFormData] = useState({ UserID: '', Password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { UserID, Password } = formData;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, `${UserID}@example.com`, Password);
      toast.success('Sign in successful!');
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Invalid User ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input
          type="text"
          name="UserID"
          value={formData.UserID}
          onChange={handleChange}
          placeholder="User ID"
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <input
          type="password"
          name="Password"
          value={formData.Password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default SignIn;
