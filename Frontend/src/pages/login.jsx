import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import useUser
import { useTheme } from '../context/ThemeContext'; // Import useTheme


// Renamed component to LoginPage to match App.jsx import
const LoginPage = () => {
  const { theme } = useTheme(); // Consume theme
  const { setCurrentUser } = useUser(); // Get setCurrentUser from context
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      setApiSuccess(data.message || 'Login successful! Redirecting...');
      if (data.user) {
        setCurrentUser(data.user);
      }
      setTimeout(() => {
        navigate('/shop');
      }, 1000);

    } catch (err) {
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* API Messages */}
      {(apiError || apiSuccess) && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-50 ${apiSuccess ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'} text-white transition-all duration-300`}> {/* Reverted to top-20 */}
          <span className="inline-block">{apiSuccess || apiError}</span>
        </div>
      )}

      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-28"> {/* Added pt-28 for fixed header, theme bg */}
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg transition-colors duration-300">
          <h3 className="text-3xl md:text-4xl text-center mb-2 font-light text-gray-900 dark:text-gray-100">
            Welcome back to <span className="text-blue-500 dark:text-blue-400 font-semibold">Scatch</span>
          </h3>
          <h4 className="text-xl md:text-2xl capitalize mb-6 text-center text-gray-600 dark:text-gray-400">Login to your account</h4>
          
          <form autoComplete="off" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                id="email"
                className="bg-gray-100 dark:bg-gray-700 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                type="email"
                placeholder="you@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                className="bg-gray-100 dark:bg-gray-700 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                type="password"
                placeholder="••••••••"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="px-5 rounded-md py-3 bg-blue-500 text-white w-full cursor-pointer hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?
              <Link
                to="/register"
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage; 