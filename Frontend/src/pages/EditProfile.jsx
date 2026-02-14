import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext'; // Assuming you have a UserContext
import { useUser } from '../context/UserContext'; // Import useUser to get user and setUser

function EditProfilePage() {
  const { currentUser: user, setCurrentUser: setUser, isAuthenticated, authLoading } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    profilePhoto: null, // For file input
    profilePhotoUrl: '', // To display current or new image
    email: '',
    name: ''
  });
  const [pageLoading, setPageLoading] = useState(true); // Renamed from 'loading'
  const [submitLoading, setSubmitLoading] = useState(false); // For form submission
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authLoading) {
      // Still waiting for auth context to load
      return;
    }

    if (isAuthenticated && user) {
      setFormData({
        phone: user.phone || '',
        address: user.address || '',
        profilePhoto: null,
        profilePhotoUrl: user.profilePhoto || 'https://via.placeholder.com/150',
        email: user.email || '',
        name: user.fullname || user.username || 'User'
      });
      setPageLoading(false);
    } else if (!isAuthenticated && !authLoading) {
      setError('User not found. Please log in to edit your profile.');
      setPageLoading(false);
      // Optionally redirect to login
      // setTimeout(() => navigate('/login'), 3000);
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        profilePhoto: file,
        profilePhotoUrl: URL.createObjectURL(file), // Preview new image
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    if (!isAuthenticated || !user || !user._id) {
      setError('User not authenticated. Please log in again.');
      setSubmitLoading(false);
      return;
    }

    let newProfilePhotoUrl = user.profilePhoto; // Start with current photo URL

    try {
      // 1. Handle Profile Photo Upload if a new photo is selected
      if (formData.profilePhoto) {
        const photoFormData = new FormData();
        photoFormData.append('profilePhoto', formData.profilePhoto);

        const photoUploadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/profile/update-photo`, {
          method: 'POST',
          body: photoFormData,
          credentials: 'include', // Send cookies with the request
          // No 'Content-Type' header needed for FormData, browser sets it with boundary
        });

        const photoUploadData = await photoUploadResponse.json();

        if (!photoUploadResponse.ok) {
          throw new Error(photoUploadData.error || photoUploadData.message || 'Failed to upload profile photo.');
        }
        newProfilePhotoUrl = photoUploadData.profilePhotoUrl; // Get the new URL from backend
        // Update user context immediately with the new photo from photo upload response
        if (photoUploadData.user) {
          setUser(photoUploadData.user);
        } else { // Fallback if full user object isn't returned by photo endpoint
          setUser(prevUser => ({ ...prevUser, profilePhoto: newProfilePhotoUrl }));
        }
        setSuccess('Profile photo updated! '); // Partial success message
      }

      // 2. Update other profile data (fullname, phone, address)
      const profileUpdatePayload = {
        fullname: formData.name, // Assuming formData.name is for fullname
        phone: formData.phone,
        address: formData.address,
      };

      const profileUpdateResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileUpdatePayload),
      });

      const profileUpdateData = await profileUpdateResponse.json();

      if (!profileUpdateResponse.ok) {
        throw new Error(profileUpdateData.error || profileUpdateData.message || 'Failed to update profile details.');
      }

      // Update user context with the latest data from the backend response
      if (profileUpdateData.user) {
        setUser(profileUpdateData.user);
      } else {
        // Fallback: update context with form data if backend doesn't return full user
        // This also ensures the newProfilePhotoUrl (if changed) is part of the context
        setUser(prevUser => ({
          ...prevUser,
          fullname: formData.name,
          phone: formData.phone,
          address: formData.address,
          profilePhoto: newProfilePhotoUrl, // Use the potentially updated photo URL
        }));
      }

      setSuccess(prevSuccess => prevSuccess.includes('Profile photo updated!') ? prevSuccess + 'Other details saved.' : 'Profile details saved.');
      setTimeout(() => navigate('/profile'), 2000);

    } catch (err) {
      setError(err.message || 'An error occurred while updating profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-12">
        <div className="w-full max-w-lg mx-auto p-8 border-4 border-black shadow-neo bg-white text-center">
          <p className="text-xl font-black uppercase tracking-widest animate-pulse">Loading editor...</p>
        </div>
      </div>
    );
  }

  // If there's an error and the page is not loading, and the user is not authenticated (after auth check)
  if (error && !pageLoading && !isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-12">
        <div className="w-full max-w-lg mx-auto p-8 border-4 border-black shadow-neo bg-white text-center">
          <p className="text-red-600 text-xl font-bold uppercase">Error: {error}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background pt-28 pb-12 transition-colors duration-300">
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
          <h2 className="text-3xl font-black text-center mb-8 uppercase tracking-tighter">Edit Profile</h2>

          {error && <p className="text-red-600 font-bold text-center mb-4 uppercase border-2 border-red-600 p-2 bg-red-50">{error}</p>}
          {success && <p className="text-green-600 font-bold text-center mb-4 uppercase border-2 border-green-600 p-2 bg-green-50">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={formData.profilePhotoUrl}
                  alt="Profile Preview"
                  className="w-32 h-32 md:w-40 md:h-40 object-cover mb-4 border-4 border-black shadow-neo-sm"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('profilePhoto').click()}>
                  <i className="ri-camera-line text-white text-3xl drop-shadow-md"></i>
                </div>
              </div>
              <label htmlFor="profilePhoto" className="block text-sm font-black uppercase text-gray-700 cursor-pointer hover:text-primary underline decoration-2 underline-offset-2">
                Change Profile Photo
              </label>
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-black uppercase text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="block w-full px-4 py-3 border-2 border-black bg-gray-100 text-gray-500 font-bold focus:outline-none cursor-not-allowed uppercase"
                disabled
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-black uppercase text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ''}
                className="block w-full px-4 py-3 border-2 border-black bg-gray-100 text-gray-500 font-bold focus:outline-none cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-black uppercase text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full px-4 py-3 border-2 border-black bg-white text-black font-bold focus:outline-none focus:shadow-neo-sm transition-all placeholder-gray-400"
                placeholder="ENTER YOUR PHONE NUMBER"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-black uppercase text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-4 py-3 border-2 border-black bg-white text-black font-bold focus:outline-none focus:shadow-neo-sm transition-all placeholder-gray-400 resize-none"
                placeholder="ENTER YOUR ADDRESS"
              ></textarea>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex-1 py-3 px-4 bg-white text-black font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading || !isAuthenticated}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;








