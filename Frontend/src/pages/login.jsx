 import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import useUser
// Import useTheme

import { toast } from '../utils/toast';
import PasswordInput from '../components/PasswordInput';
import GoogleLoginButton from '../components/GoogleLoginButton';


const LoginPage = () => {
  // Consume theme
  const { setCurrentUser, isAuthenticated } = useUser(); // Get setCurrentUser from context
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

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/shop');
    }
  }, [isAuthenticated, navigate]);

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

      toast.success(data.message || 'Login successful! Redirecting...');
      if (data.user) {
        setCurrentUser(data.user);
      }
      setTimeout(() => {
        navigate('/shop');
      }, 1000);

    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>


      <div className="w-full min-h-screen flex items-center justify-center px-4 bg-background pt-28 pb-12">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
          <h3 className="text-4xl font-black text-center mb-2 uppercase tracking-tighter">
            Welcome back
          </h3>
          <h4 className="text-xl font-bold mb-8 text-center text-gray-500 uppercase">
            Login to your account
          </h4>

          <form autoComplete="off" onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-black uppercase mb-2">Email Address</label>
              <input
                id="email"
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold"
                type="email"
                placeholder="YOU@EXAMPLE.COM"
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
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordStep(1);
                    setForgotPasswordError(null);
                    setForgotPasswordSuccess(null);
                    setForgotPasswordEmail(formData.email);
                  }}
                  className="text-xs font-black uppercase text-blue-600 hover:text-blue-800 hover:underline decoration-2 underline-offset-2"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Wait...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center justify-center my-8 w-full">
            <div className="flex-grow border-t-2 border-black"></div>
            <span className="px-4 text-sm font-black uppercase bg-white">OR</span>
            <div className="flex-grow border-t-2 border-black"></div>
          </div>

          {/* Google Login Button */}
          <div className="w-full">
            <GoogleLoginButton />
          </div>

          <div className="text-center mt-8 pt-4 border-t-2 border-black border-dashed">
            <p className="text-sm font-bold uppercase text-gray-600">
              New here?
              <Link
                to="/register"
                className="text-black hover:text-primary ml-2 underline decoration-2 underline-offset-2"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
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
      // theme prop removed
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
  // theme - REMOVED
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-black hover:text-red-600 transition-colors"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-black text-red-600 font-bold text-sm uppercase">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-black text-green-800 font-bold text-sm uppercase">
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-black uppercase mb-2">Enter your email address</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOU@EXAMPLE.COM"
                required
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold placeholder:uppercase"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || otpResendTimer > 0}
            >
              {isLoading ? 'Sending OTP...' : (otpResendTimer > 0 ? `Resend OTP in ${formatTime(otpResendTimer)}` : 'Send OTP')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-black uppercase mb-2">Enter OTP</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-DIGIT OTP"
                required
                maxLength="6"
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold placeholder:uppercase"
                disabled={isLoading}
              />
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs font-black uppercase text-blue-600 hover:text-blue-800 hover:underline decoration-2 underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || otpResendTimer > 0}
                >
                  {otpResendTimer > 0 ? `Resend OTP in ${formatTime(otpResendTimer)}` : 'Resend OTP'}
                </button>
              </div>
              {otpAttempts > 0 && otpAttempts < 3 && (
                <p className="text-xs font-bold text-yellow-600 mt-1 uppercase">
                  {3 - otpAttempts} attempts remaining.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-black uppercase mb-2">New Password</label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold placeholder:uppercase"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-black uppercase mb-2">Confirm New Password</label>
              <PasswordInput
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold placeholder:uppercase"
                disabled={isLoading}
              />
              {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="text-red-600 font-bold text-xs mt-1 uppercase">Passwords do not match.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || (newPassword !== confirmNewPassword) || !newPassword}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;







