import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { useUser } from '../context/UserContext'; // Import useUser
import { CardContainer, CardBody, CardItem } from '../components/ui/Card3D'; // Import 3D Card components
import { toast } from '../utils/toast';


// Renamed component to RegisterPage to match App.jsx import
const RegisterPage = () => {
  const { theme } = useTheme(); // Consume theme
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


      <div className="w-full min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pt-28 pb-12"> {/* Added pt-28 for fixed header, theme bg, pb-12 for bottom space */}
        <CardContainer containerClassName="py-0" className="w-full max-w-md"> {/* Reverted to max-w-md */}
          <CardBody className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 w-full h-auto"> {/* Adjusted h-auto */}
            <CardItem
              as="h3"
              translateZ="60"
              className="text-3xl md:text-4xl text-center mb-2 font-light text-gray-900 dark:text-gray-100 w-full"
            >
              Welcome to <span className="text-blue-500 dark:text-blue-400 font-semibold">Scatch</span>
            </CardItem>
            <CardItem
              as="h4"
              translateZ="50"
              className="text-xl md:text-2xl mb-6 text-center text-gray-600 dark:text-gray-400 w-full"
            >
              Create your account
            </CardItem>
            
            {/* Main Registration Form */}
            <form onSubmit={handleInitialRegisterSubmit} className="w-full">
              <CardItem translateZ="40" className="mb-4 w-full">
                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  id="fullname"
                  className="bg-gray-100 dark:bg-gray-700 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  type="text"
                  placeholder="John Doe"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  disabled={isOtpSending || showOtpModal} // Disable if OTP is being sent or modal is shown
                />
              </CardItem>
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
                  disabled={isOtpSending || showOtpModal}
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
                  disabled={isOtpSending || showOtpModal}
                />
              </CardItem>
              <CardItem translateZ="10" className="w-full">
                <button
                  type="submit" // This button now triggers OTP sending
                  className="px-5 rounded-md py-3 bg-blue-500 text-white w-full cursor-pointer hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                  disabled={isOtpSending || showOtpModal || !formData.email || !formData.fullname || !formData.password}
                >
                  {isOtpSending ? 'Sending OTP...' : 'Register'}
                </button>
              </CardItem>
            </form>
            
            <CardItem translateZ="5" className="text-center mt-6 w-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?
                <Link
                  to="/login"
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1"
                >
                  Login here
                </Link>
              </p>
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className={`relative p-8 border w-full max-w-md shadow-lg rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
            {/* Removed the explicit close button */}
            <h3 className={`text-2xl text-center mb-6 font-light ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Verify Your Email</h3>
            <p className={`mb-2 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              An OTP has been sent to {formData.email}.
            </p>
            <p className={`mb-4 text-center text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Please enter the 6-digit code below.
            </p>
            
            {(apiError && showOtpModal) && (
                <div className="my-3 p-2 text-center text-sm text-white bg-red-500 dark:bg-red-600 rounded-md">
                    {apiError}
                </div>
            )}
             {(apiSuccess && showOtpModal && otpSent && !apiError) && (
                <div className="my-3 p-2 text-center text-sm text-white bg-green-500 dark:bg-green-600 rounded-md">
                    {apiSuccess}
                </div>
            )}

            <form onSubmit={handleOtpVerificationAndAccountCreation}>
              <div className="flex justify-center space-x-2 mb-6" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpInputRefs[index]}
                    id={`otp-digit-${index}`}
                    name={`otp-digit-${index}`}
                    type="text" // Use text to allow easier control, validation handles digits
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className={`w-10 h-12 text-center text-xl font-semibold border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} transition-colors`}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="px-5 rounded-md py-3 bg-green-500 text-white w-full cursor-pointer hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                disabled={isLoading || otpDigits.join('').length !== 6}
              >
                {isLoading ? 'Verifying & Registering...' : 'Verify & Create Account'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={handleResendOtp}
                disabled={resendOtpDisabled || isOtpSending}
                className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {resendOtpDisabled ? `Resend OTP in ${resendOtpTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterPage;