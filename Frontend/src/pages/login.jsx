import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import useUser
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { CardContainer, CardBody, CardItem } from '../components/ui/Card3D'; // Import 3D Card components


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

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: enter email, 2: enter OTP and new password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(null);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  let resendInterval;


  const startOtpResendTimer = () => {
    setOtpResendTimer(60); // 60 seconds timer
    // Clear any existing interval before starting a new one
    if (resendInterval) clearInterval(resendInterval);
    resendInterval = setInterval(() => {
      setOtpResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(resendInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear interval on component unmount
  React.useEffect(() => {
    return () => {
      if (resendInterval) clearInterval(resendInterval);
    };
  }, []);


  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);

    if (otpResendTimer > 0 && e) { // e check to ensure it's not a programmatic resend
        setForgotPasswordError(`Please wait ${formatTime(otpResendTimer)} before resending OTP.`);
        setForgotPasswordLoading(false);
        return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP.');
      
      setForgotPasswordSuccess(data.message || 'OTP sent successfully. Please check your email.');
      setForgotPasswordStep(2); // Move to OTP entry step
      setOtpAttempts(0); // Reset attempts for new OTP
      startOtpResendTimer(); // Start cooldown for resend button
    } catch (err) {
      setForgotPasswordError(err.message || 'An error occurred.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) {
        setForgotPasswordError(`Please wait ${formatTime(otpResendTimer)} before resending OTP.`);
        return;
    }
    // Reuse handleSendOtp logic for resending
    // No event object 'e' is passed, so it won't show the "wait" error from user click
    await handleSendOtp();
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setForgotPasswordError("New passwords do not match.");
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        const currentAttempts = otpAttempts + 1;
        setOtpAttempts(currentAttempts);

        let errorMessage = data.error || 'Failed to reset password.'; // Use backend error directly

        if (currentAttempts >= 3) {
          // If it's the 3rd failed attempt, override message to be very clear,
          // as backend might just say "0 attempts remaining"
          errorMessage = "Maximum OTP attempts reached. Please request a new OTP.";
          // Immediate reset on max attempts
          setShowForgotPassword(false);
          setForgotPasswordStep(1);
          setOtp('');
          setNewPassword('');
          setConfirmNewPassword('');
          setOtpAttempts(0); // Reset attempts for next cycle
        }
        // For attempts 1 and 2, the backend message "Invalid OTP. X attempts remaining." is sufficient.
        throw new Error(errorMessage);
      }
      
      setForgotPasswordSuccess(data.message || 'Password reset successfully! You can now login with your new password.');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      // Immediate close on success
      setShowForgotPassword(false);
      setForgotPasswordStep(1);
    } catch (err) {
      setForgotPasswordError(err.message || 'An error occurred.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

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
        <div className={`fixed bottom-6 left-6 p-4 rounded-xl shadow-2xl z-50 max-w-sm backdrop-blur-sm border ${apiSuccess ? 'bg-green-500/90 border-green-400/50' : 'bg-red-500/90 border-red-400/50'} text-white transition-all duration-500 transform animate-in slide-in-from-left-5`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${apiSuccess ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
            <span className="text-sm font-medium">{apiSuccess || apiError}</span>
          </div>
        </div>
      )}

      <div className="w-full min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-28 pb-12"> {/* Added pt-28 for fixed header, theme bg, pb-12 for bottom space */}
        <CardContainer containerClassName="py-0" className="w-full max-w-md">
          <CardBody className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 w-full h-auto"> {/* Adjusted h-auto for content fit */}
            <CardItem
              as="h3"
              translateZ="50"
              className="text-3xl md:text-4xl text-center mb-2 font-light text-gray-900 dark:text-gray-100 w-full"
            >
              Welcome back to <span className="text-blue-500 dark:text-blue-400 font-semibold">Scatch</span>
            </CardItem>
            <CardItem
              as="h4"
              translateZ="40"
              className="text-xl md:text-2xl capitalize mb-6 text-center text-gray-600 dark:text-gray-400 w-full"
            >
              Login to your account
            </CardItem>
            
            <form autoComplete="off" onSubmit={handleSubmit} className="w-full">
              <CardItem translateZ="30" className="mb-4 w-full">
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
              </CardItem>
              <CardItem translateZ="20" className="mb-6 w-full">
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
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotPasswordStep(1);
                      setForgotPasswordError(null);
                      setForgotPasswordSuccess(null);
                      setForgotPasswordEmail(formData.email); // Pre-fill email if available
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </CardItem>
              <CardItem translateZ="10" className="w-full">
                <button
                  type="submit"
                  className="px-5 rounded-md py-3 bg-blue-500 text-white w-full cursor-pointer hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging In...' : 'Login'}
                </button>
              </CardItem>
            </form>
            
            <CardItem translateZ="5" className="text-center mt-6 w-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?
                <Link
                  to="/register"
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1"
                >
                  Register here
                </Link>
              </p>
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>

      <ForgotPasswordModal
        show={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          // Clear interval if modal is closed manually
          if (resendInterval) clearInterval(resendInterval);
          setOtpResendTimer(0);
        }}
        step={forgotPasswordStep}
        setStep={setForgotPasswordStep}
        email={forgotPasswordEmail}
        setEmail={setForgotPasswordEmail}
        otp={otp}
        setOtp={setOtp}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmNewPassword={confirmNewPassword}
        setConfirmNewPassword={setConfirmNewPassword}
        isLoading={forgotPasswordLoading}
        error={forgotPasswordError}
        success={forgotPasswordSuccess}
        handleSendOtp={handleSendOtp}
        handleVerifyOtpAndReset={handleVerifyOtpAndReset}
        otpResendTimer={otpResendTimer}
        handleResendOtp={handleResendOtp}
        otpAttempts={otpAttempts}
        theme={theme}
      />
    </>
  );
};

// Helper function to format timer
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};


// Forgot Password Modal Component (can be moved to a separate file if it grows larger)
const ForgotPasswordModal = ({
  show,
  onClose,
  step,
  setStep,
  email,
  setEmail,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  isLoading,
  error,
  success,
  handleSendOtp,
  handleVerifyOtpAndReset,
  otpResendTimer,
  handleResendOtp,
  otpAttempts,
  theme
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`p-6 rounded-lg shadow-xl w-full max-w-md ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <button onClick={onClose} className={`text-2xl ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>&times;</button>
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm mb-3 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-center">{error}</p>}
        {success && <p className="text-green-500 dark:text-green-400 text-sm mb-3 p-2 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded text-center">{success}</p>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label htmlFor="forgot-email" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Enter your email address</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}`}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 disabled:opacity-50"
              disabled={isLoading || otpResendTimer > 0}
            >
              {isLoading ? 'Sending OTP...' : (otpResendTimer > 0 ? `Resend OTP in ${formatTime(otpResendTimer)}` : 'Send OTP')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndReset}>
            <div className="mb-4">
              <label htmlFor="otp" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Enter OTP</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                required
                maxLength="6"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}`}
                disabled={isLoading}
              />
               <div className="text-right mt-1">
                 <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || otpResendTimer > 0}
                  >
                    {otpResendTimer > 0 ? `Resend OTP in ${formatTime(otpResendTimer)}` : 'Resend OTP'}
                  </button>
               </div>
               {otpAttempts > 0 && otpAttempts < 3 && ( // Show only if attempts made and less than 3
                 <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                   {3 - otpAttempts} attempts remaining for this OTP.
                 </p>
               )}
            </div>
            <div className="mb-4">
              <label htmlFor="new-password" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}`}
                disabled={isLoading}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirm-new-password" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}`}
                disabled={isLoading}
              />
              {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 disabled:opacity-50"
              disabled={isLoading || (newPassword !== confirmNewPassword) || !newPassword}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;