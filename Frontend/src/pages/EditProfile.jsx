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
    return <div className="container mx-auto p-4 pt-20 text-center text-gray-700 dark:text-gray-700 dark:text-purple-200">Loading editor...</div>;
  }

  // If there's an error and the page is not loading, and the user is not authenticated (after auth check)
  if (error && !pageLoading && !isAuthenticated && !authLoading) {
     return <div className="container mx-auto p-4 pt-20 text-center text-red-500 dark:text-red-400">Error: {error}</div>;
  }


  return (
    <div className="container mx-auto p-4 pt-20 min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E] transition-colors duration-300">
      <div className="max-w-lg mx-auto bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 shadow-lg dark:shadow-purple-500/20 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-purple-100">Edit Profile</h2>
        {error && <p className="text-red-500 dark:text-red-400 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 dark:text-green-400 text-center mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <img
              src={formData.profilePhotoUrl}
              alt="Profile Preview"
              className="w-32 h-32 rounded-full object-cover mb-4 border border-purple-500/30"
            />
            <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 dark:text-purple-200 cursor-pointer">
              Change Profile Photo
            </label>
            <input
              type="file"
              id="profilePhoto"
              name="profilePhoto"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300 dark:hover:file:bg-gray-600 sr-only" // sr-only to hide default input, style the label
           />
            <button type="button" onClick={() => document.getElementById('profilePhoto').click()} className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
               Choose File
           </button>
         </div>

         <div>
           <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-purple-200">
             Name
           </label>
           <input
             type="text"
             name="name"
             id="name"
             value={formData.name || ''}
             onChange={handleChange}
             className="mt-1 block w-full px-3 py-2 border border-purple-500/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-[#2A1F47] text-gray-900 dark:text-purple-200"
             disabled
           />
         </div>

         <div>
           <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-purple-200">
             Email
           </label>
           <input
             type="email"
             name="email"
             id="email"
             value={formData.email || ''}
             className="mt-1 block w-full px-3 py-2 border border-purple-500/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-[#2A1F47] text-gray-900 dark:text-purple-200"
             disabled
           />
         </div>

         <div>
           <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-purple-200">
             Phone Number
           </label>
           <input
             type="tel"
             name="phone"
             id="phone"
             value={formData.phone}
             onChange={handleChange}
             className="mt-1 block w-full px-3 py-2 border border-purple-500/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-[#2A1F47] text-gray-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
             placeholder="Enter your phone number"
           />
         </div>

         <div>
           <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-purple-200">
             Address
           </label>
           <textarea
             name="address"
             id="address"
             rows="3"
             value={formData.address}
             onChange={handleChange}
             className="mt-1 block w-full px-3 py-2 border border-purple-500/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm bg-white dark:bg-[#2A1F47] text-gray-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50"
             placeholder="Enter your address"
           ></textarea>
         </div>

         <div className="flex items-center justify-between">
           <button
             type="button"
             onClick={() => navigate('/profile')}
             className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 dark:text-purple-100 bg-purple-900/50 hover:bg-purple-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-400"
           >
             Cancel
           </button>
           <button
             type="submit"
             disabled={submitLoading || !isAuthenticated} // Disable if not authenticated
             className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600"
           >
             {submitLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfilePage;








