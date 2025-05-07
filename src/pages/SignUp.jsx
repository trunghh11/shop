// SignUp.jsx
import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [formData, setFormData] = useState({
    FullName: '',
    UserID: '',
    Password: '',
    ConfirmPassword: '',
    Role: 'Student',
    Class: '',
    Email: '',
    FacebookLink: '',
    Phone: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { FullName, UserID, Password, ConfirmPassword, Role, Class, Email, FacebookLink, Phone } = formData;

    if (Password !== ConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (Role === 'Student' && !Class) {
      toast.error('Class is required for students.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, `${UserID}@example.com`, Password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        FullName,
        UserID,
        Role,
        Class: Role === 'Student' ? Class : '',
        Email,
        FacebookLink,
        Phone,
        AvgRating: '0',
        RatingCount: '0',
      });

      toast.success('Sign up successful!');
      navigate('/');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input
          type="text"
          name="FullName"
          value={formData.FullName}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
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
        <input
          type="password"
          name="ConfirmPassword"
          value={formData.ConfirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <select
          name="Role"
          value={formData.Role}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="Student">Student</option>
          <option value="Teacher">Teacher</option>
        </select>
        {formData.Role === 'Student' && (
          <input
            type="text"
            name="Class"
            value={formData.Class}
            onChange={handleChange}
            placeholder="Class"
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        )}
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          placeholder="Email (optional)"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <input
          type="url"
          name="FacebookLink"
          value={formData.FacebookLink}
          onChange={handleChange}
          placeholder="Facebook Link (optional)"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          name="Phone"
          value={formData.Phone}
          onChange={handleChange}
          placeholder="Phone"
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;
