import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import useUser
import { useOwner } from '../context/OwnerContext'; // Import useOwner
import { useTheme } from '../context/ThemeContext'; // Import useTheme



const Header = () => {
  const { currentUser, isAuthenticated, logoutUser } = useUser();
  const { currentOwner, isOwnerAuthenticated, logoutOwnerContext } = useOwner();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const navigate = useNavigate();

  const handleUserLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    } else {
      console.error('User logout failed:', result.error);
    }
  };

  const handleOwnerLogout = async () => {
    const result = await logoutOwnerContext();
    if (result.success) {
      navigate('/owner-login'); // Or to home page
    } else {
      console.error('Owner logout failed:', result.error);
    }
  };
  
  // Determine the correct logo link based on authentication state
  let logoLink = "/";
  if (isOwnerAuthenticated) {
    logoLink = "/admin"; // Or owner dashboard
  } else if (isAuthenticated) {
    logoLink = "/shop";
  }

  return (
    <nav className="w-full flex justify-between items-center px-5 py-3 bg-white dark:bg-gray-800 shadow-md fixed z-40 transition-colors duration-300">
      <Link to={logoLink} className="text-2xl font-bold text-blue-600 dark:text-blue-400">Scatch</Link>

      <div className="flex gap-4 items-center">
        {isOwnerAuthenticated && currentOwner ? (
          <>
            <span className="text-gray-700 dark:text-gray-300">Owner: {currentOwner.fullname || currentOwner.email}</span>
            <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">Admin Panel</Link>
            <Link to="/create-product" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">Create Product</Link>
            <button
              onClick={handleOwnerLogout}
              className="px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Owner Logout
            </button>
          </>
        ) : isAuthenticated && currentUser ? (
          <>
            <span className="text-gray-700 dark:text-gray-300">Hi, {currentUser.fullname || currentUser.email}!</span>
            <Link to="/shop" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Shop</Link>
            <Link to="/cart" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Cart</Link>
            <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Profile</Link>
            <button
              onClick={handleUserLogout}
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">User Login</Link>
            <Link to="/owner-login" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">Owner Login</Link>
            <Link to="/register" className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">Register</Link>
          </>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <i className="ri-moon-fill text-xl text-gray-700 dark:text-yellow-400"></i> // Moon icon for light theme (to switch to dark)
          ) : (
            <i className="ri-sun-fill text-xl text-yellow-400 dark:text-yellow-300"></i> // Sun icon for dark theme (to switch to light)
          )}
        </button>
      </div>
    </nav>
  );
};

export default Header;
