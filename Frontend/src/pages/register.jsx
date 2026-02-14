import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Import useTheme
import { useUser } from '../context/UserContext'; // Import useUser

import { toast } from '../utils/toast';
import PasswordInput from '../components/PasswordInput';
import GoogleLoginButton from '../components/GoogleLoginButton';


// Renamed component to RegisterPage to match App.jsx import
const RegisterPage = () => {
  // Consume theme
  const { setCurrentUser } = useUser(); // Get setCurrentUser from context
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    otp: '' // This will store the combined OTP string
  });
  const [otpDigits, setOtpDigits] = useState(Array(6).fill('')); // For 6 individual OTP inputs
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
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
  const [resendOtpDisabled, setResendOtpDisabled] = useState(false);
  const [resendOtpTimer, setResendOtpTimer] = useState(0);
  const navigate = useNavigate();
  const otpInputRefs = Array(6).fill(0).map((_, i) => React.createRef());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // If handling OTP digits, it will be done by handleOtpDigitChange
    if (!name.startsWith('otp-digit-')) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (value.length > 1) { // Handle paste case or fast typing
      value = value.slice(-1); // Take only the last character
    }
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    setFormData(prev => ({ ...prev, otp: newOtpDigits.join('') }));


    // Auto-focus next input if a digit is entered
    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault(); // Prevent default backspace behavior like navigating back
      const newOtpDigits = [...otpDigits];
      if (newOtpDigits[index]) {
        newOtpDigits[index] = ''; // Clear current input
      } else if (index > 0) {
        newOtpDigits[index - 1] = ''; // Clear previous input if current is already empty
        otpInputRefs[index - 1].current?.focus();
      }
      setOtpDigits(newOtpDigits);
      setFormData(prev => ({ ...prev, otp: newOtpDigits.join('') }));
    } else if (e.key >= '0' && e.key <= '9') {
      // Allow default behavior for number input, which is handled by onChange
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    } else if (e.key.length === 1 && !/^\d$/.test(e.key) && e.key !== 'Tab' && !e.metaKey && !e.ctrlKey) {
      // Prevent non-numeric characters unless it's a control key or Tab
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, ''); // Get only digits
    if (pasteData.length === 6) {
      const newOtpDigits = pasteData.split('');
      setOtpDigits(newOtpDigits);
      setFormData(prev => ({ ...prev, otp: newOtpDigits.join('') }));
      otpInputRefs[5].current?.focus(); // Focus the last input after paste
    }
  };

  // This function is now for the initial "Register" button click, which sends the OTP
  const handleInitialRegisterSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!formData.email || !formData.fullname || !formData.password) {
      setApiError("Please fill in all required fields: Full Name, Email, and Password.");
      return;
    }
    setIsOtpSending(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send OTP');
      }

      setApiSuccess(data.message || 'OTP sent successfully. Please check your email and enter it below.');
      setOtpSent(true);
      setShowOtpModal(true);

      // Start cooldown timer immediately after first OTP is sent
      setResendOtpDisabled(true);
      setResendOtpTimer(120); // 120 seconds (2 minutes) cooldown
      const timerInterval = setInterval(() => {
        setResendOtpTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(timerInterval);
            setResendOtpDisabled(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

    } catch (err) {
      setApiError(err.message || 'Failed to send OTP. Please try again.');
      setOtpSent(false);
      setShowOtpModal(false);
    } finally {
      setIsOtpSending(false);
    }
  };

  // This function handles the submission from within the OTP modal
  const handleOtpVerificationAndAccountCreation = async (e) => {
    e.preventDefault(); // Prevent default form submission if called from a form
    const currentOtp = otpDigits.join('');
    if (currentOtp.length !== 6) {
      setApiError("Please enter the complete 6-digit OTP."); // Error specific to modal
      return;
    }

    setIsLoading(true);
    setApiError(null); // Clear previous errors
    // setApiSuccess(null); // Keep success message from OTP sending if desired, or clear

    try {
      const registrationPayload = {
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        otp: currentOtp, // Use the joined OTP from otpDigits
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      // Success!
      setShowOtpModal(false); // Close modal on success
      toast.success(data.message || 'Registration successful! Redirecting...');
      if (data.user) {
        setCurrentUser(data.user);
      }
      setTimeout(() => {
        navigate('/shop');
      }, 1500);

    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setOtpSent(false); // Reset otpSent if modal is closed without verification
    setApiError(null);
    setApiSuccess(null);
    setOtpDigits(Array(6).fill('')); // Clear OTP digit inputs
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  const handleResendOtp = async () => {
    if (resendOtpDisabled) return;

    setIsOtpSending(true);
    setApiError(null);
    setApiSuccess(null);
    setOtpDigits(Array(6).fill(''));
    setFormData(prev => ({ ...prev, otp: '' }));


    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to resend OTP');
      }
      setApiSuccess(data.message || 'New OTP sent successfully. Please check your email.');

      // Start cooldown timer
      setResendOtpDisabled(true);
      setResendOtpTimer(120); // 120 seconds (2 minutes) cooldown
      const timerInterval = setInterval(() => {
        setResendOtpTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(timerInterval);
            setResendOtpDisabled(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

    } catch (err) {
      setApiError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsOtpSending(false);
    }
  };

  return (
    <>


      <div className="w-full min-h-screen flex items-center justify-center px-4 bg-background pt-28 pb-12">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
          <h3 className="text-4xl font-black text-center mb-2 uppercase tracking-tighter">
            Welcome
          </h3>
          <h4 className="text-xl font-bold mb-8 text-center text-gray-500 uppercase">
            Create your account
          </h4>

          {apiError && !showOtpModal && (
            <div className="mb-6 p-3 bg-red-500 text-white font-black uppercase text-xs text-center border-2 border-black shadow-neo-sm">
              <i className="ri-error-warning-fill mr-2"></i>
              {apiError}
            </div>
          )}

          {apiSuccess && !showOtpModal && (
            <div className="mb-6 p-3 bg-green-500 text-white font-black uppercase text-xs text-center border-2 border-black shadow-neo-sm">
              <i className="ri-checkbox-circle-fill mr-2"></i>
              {apiSuccess}
            </div>
          )}

          {/* Main Registration Form */}
          <form onSubmit={handleInitialRegisterSubmit} className="w-full space-y-4">
            <div>
              <label htmlFor="fullname" className="block text-sm font-black uppercase mb-2">Full Name</label>
              <input
                id="fullname"
                className="block w-full px-4 py-3 border-2 border-black bg-gray-50 focus:outline-none focus:shadow-neo-sm transition-all font-bold uppercase"
                type="text"
                placeholder="JOHN DOE"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                required
                disabled={isOtpSending || showOtpModal}
              />
            </div>
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
                disabled={isOtpSending || showOtpModal}
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
                disabled={isOtpSending || showOtpModal}
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              disabled={isOtpSending || showOtpModal || !formData.email || !formData.fullname || !formData.password}
            >
              {isOtpSending ? 'Sending OTP...' : 'Register'}
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
              Already have an account?
              <Link
                to="/login"
                className="text-black hover:text-primary ml-2 underline decoration-2 underline-offset-2"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white border-4 border-black shadow-neo p-8 relative">
            <h3 className="text-3xl font-black text-center mb-6 uppercase">Verify Your Email</h3>
            <p className="mb-2 text-center text-sm font-bold text-gray-700">
              An OTP has been sent to <span className="underline">{formData.email}</span>
            </p>
            <p className="mb-6 text-center text-xs font-bold uppercase text-gray-500">
              Please enter the 6-digit code below.
            </p>

            {(apiError && showOtpModal) && (
              <div className="my-3 p-3 text-center text-xs font-black uppercase text-white bg-red-500 border-2 border-black shadow-neo-sm">
                {apiError}
              </div>
            )}
            {(apiSuccess && showOtpModal && otpSent && !apiError) && (
              <div className="my-3 p-3 text-center text-xs font-black uppercase text-white bg-green-500 border-2 border-black shadow-neo-sm">
                {apiSuccess}
              </div>
            )}

            <form onSubmit={handleOtpVerificationAndAccountCreation} className="mt-6">
              <div className="flex justify-center gap-2 mb-8" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpInputRefs[index]}
                    id={`otp-digit-${index}`}
                    name={`otp-digit-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 text-center text-2xl font-black border-2 border-black bg-gray-50 focus:shadow-neo-sm focus:outline-none transition-all"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-green-500 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || otpDigits.join('').length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={handleResendOtp}
                disabled={resendOtpDisabled || isOtpSending}
                className="text-xs font-black uppercase text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed underline decoration-2 underline-offset-2"
              >
                {resendOtpDisabled ? `Resend OTP in ${resendOtpTimer}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500 text-white border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <i className="ri-close-line font-bold"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterPage;







