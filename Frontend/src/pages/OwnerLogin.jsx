import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext'; // Import useOwner
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { CardContainer, CardBody, CardItem } from '../components/ui/Card3D'; // Import 3D Card components


const OwnerLoginPage = () => {
  const { theme } = useTheme(); // Consume theme
  const { loginOwnerContext } = useOwner(); // Get loginOwnerContext
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/owners/login`, {
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
      
      if (data.owner) {
        loginOwnerContext(data.owner);
      }
      setApiSuccess(data.message || 'Owner login successful! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin');
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

      <div className="w-full min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-28 pb-12"> {/* Added pt-28 for fixed header, theme bg, pb-12 for bottom space */}
        <CardContainer containerClassName="py-0" className="w-full max-w-md">
          <CardBody className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 w-full h-auto"> {/* Adjusted h-auto */}
            <CardItem
              as="h3"
              translateZ="50"
              className="text-3xl md:text-4xl text-center mb-2 font-light text-gray-900 dark:text-gray-100 w-full"
            >
              Owner Access to <span className="text-purple-500 dark:text-purple-400 font-semibold">Scatch Admin</span>
            </CardItem>
            <CardItem
              as="h4"
              translateZ="40"
              className="text-xl md:text-2xl capitalize mb-6 text-center text-gray-600 dark:text-gray-400 w-full"
            >
              Login to your owner account
            </CardItem>
            
            <form autoComplete="off" onSubmit={handleSubmit} className="w-full">
              <CardItem translateZ="30" className="mb-4 w-full">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  id="email"
                  className="bg-gray-100 dark:bg-gray-700 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  type="email"
                  placeholder="owner@example.com"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </CardItem>
              <CardItem translateZ="20" className="mb-6 w-full">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  id="password"
                  className="bg-gray-100 dark:bg-gray-700 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </CardItem>
              <CardItem translateZ="10" className="w-full">
                <button
                  type="submit"
                  className="px-5 rounded-md py-3 bg-purple-500 text-white w-full cursor-pointer hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging In...' : 'Owner Login'}
                </button>
              </CardItem>
            </form>
            
            <CardItem translateZ="5" className="text-center mt-6 w-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Not an owner?
                <Link
                  to="/login"
                  className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium ml-1"
                >
                  User Login
                </Link>
              </p>
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>
    </>
  );
};

export default OwnerLoginPage;