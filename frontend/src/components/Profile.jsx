import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let imageUrl;

      try {
        // Try backend Cloudinary upload first
        const formData = new FormData();
        formData.append('image', file);

        console.log('Uploading via backend Cloudinary API...');

        const uploadResponse = await fetch(`${API_URL}/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
          console.log('Backend Cloudinary upload successful:', imageUrl);
        } else {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Backend upload failed');
        }
      } catch (backendError) {
        console.warn('Backend Cloudinary upload failed, falling back to base64:', backendError);
        // Fall back to base64
        imageUrl = await convertToBase64(file);
      }

      // Update user profile with new photo URL
      const updateResponse = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          photoURL: imageUrl
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedUser = await updateResponse.json();
      updateUser(updatedUser.user);
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to update profile picture: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update display name');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser.user);
      setSuccess('Display name updated successfully!');
    } catch (err) {
      setError('Failed to update display name: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/users/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (photoURL) => {
    if (photoURL && !photoURL.includes('via.placeholder.com')) {
      return photoURL;
    }
    // Use a better fallback avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random&color=fff&size=150`;
  };

  return (
    <div className="max-w-2xl mt-2 mb-2 mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <img
            src={getAvatarUrl(user?.photoURL)}
            alt={user?.username || 'User'}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
            title="Change profile picture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.displayName || user?.username || 'User'}
          </h1>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500">
            Status: <span className="capitalize">{user?.status || 'offline'}</span>
          </p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Display Name Update */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Name</h2>
          <form onSubmit={handleNameUpdate} className="flex space-x-4">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </form>
        </div>

        {/* Password Update */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
