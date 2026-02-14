import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';

import { toast } from '../utils/toast';
import PasswordInput from '../components/PasswordInput';

const OwnerLoginPage = () => {

  const { loginOwnerContext, isOwnerAuthenticated } = useOwner();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Auto-dismiss messages after 3 seconds
  useEffect(() => {
    if (apiError || apiSuccess) {
      const timer = setTimeout(() => {
        setApiError(null);
        setApiSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [apiError, apiSuccess]);
  const navigate = useNavigate();

  // Redirect if already logged in as owner
  useEffect(() => {
    if (isOwnerAuthenticated) {
      navigate('/admin');
    }
  }, [isOwnerAuthenticated, navigate]);

  // Check if already authenticated on component mount
  useEffect(() => {
    if (isOwnerAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, []);

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
      toast.success(data.message || 'Owner login successful! Redirecting...');

      setTimeout(() => {
        navigate('/admin');
      }, 1000);

    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 bg-background pt-28 pb-12">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-purple-600 border-b-2 border-black"></div>
        <h3 className="text-3xl font-black text-center mb-2 uppercase tracking-tighter">
          Admin Access
        </h3>
        <h4 className="text-lg font-bold mb-8 text-center text-purple-600 uppercase">
          Owner Login
        </h4>

        <form autoComplete="off" onSubmit={handleSubmit} className="w-full space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-black uppercase mb-2">Email Address</label>
            <input
              id="email"
              className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold"
              type="email"
              placeholder="OWNER@EXAMPLE.COM"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-black uppercase mb-2">Password</label>
            <PasswordInput
              id="password"
              className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Confirming...' : 'Enter Admin Panel'}
          </button>
        </form>

        <div className="text-center mt-8 pt-4 border-t-2 border-black border-dashed">
          <p className="text-sm font-bold uppercase text-gray-600">
            Not an owner?
            <Link
              to="/login"
              className="text-black hover:text-purple-600 ml-2 underline decoration-2 underline-offset-2"
            >
              User Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerLoginPage;
