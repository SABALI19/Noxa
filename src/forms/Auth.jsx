// src/forms/Auth.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiCheck, FiBell, FiTrendingUp, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../components/Button';

const Auth = ({
  onLogin,
  onVerifyLoginOtp,
  onSignup,
  onVerifySignupEmail,
  onResendSignupVerification,
  onForgotPassword,
  onResetPassword,
  onDemoLogin,
  initialIsLogin = true,
  isLoading = false,
}) => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [loginOtpForm, setLoginOtpForm] = useState({
    otp: '',
    loginOtpToken: '',
    email: '',
    expiresAt: '',
    loginOtp: '',
  });
  const [signupVerificationForm, setSignupVerificationForm] = useState({
    otp: '',
    signupVerificationToken: '',
    email: '',
    expiresAt: '',
    signupOtp: '',
    signupData: null,
  });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [forgotForm, setForgotForm] = useState({
    email: '',
  });
  const [resetForm, setResetForm] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loginNeedsVerification, setLoginNeedsVerification] = useState(false);
  const isLoginOtpStep = Boolean(loginOtpForm.loginOtpToken);
  const isSignupVerificationStep = Boolean(signupVerificationForm.signupVerificationToken);
  const isExistingAccountActivation =
    isSignupVerificationStep && !signupVerificationForm.signupData;
  const passwordRuleMessage =
    "Password must be at least 8 characters and include uppercase, lowercase, and a number.";

  useEffect(() => {
    setIsLogin(initialIsLogin);
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setLoginOtpForm({
      otp: '',
      loginOtpToken: '',
      email: '',
      expiresAt: '',
      loginOtp: '',
    });
    setSignupVerificationForm({
      otp: '',
      signupVerificationToken: '',
      email: '',
      expiresAt: '',
      signupOtp: '',
      signupData: null,
    });
    setStatusMessage('');
    setErrors({});
    setLoginNeedsVerification(false);
  }, [initialIsLogin]);

  useEffect(() => {
    const tokenFromQuery = searchParams.get('token') || searchParams.get('resetToken') || '';
    if (tokenFromQuery) {
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setResetForm((prev) => ({
        ...prev,
        token: tokenFromQuery,
      }));
      setStatusMessage('');
      setErrors({});
    }
  }, [searchParams]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const resetSignupVerificationStep = () => {
    setSignupVerificationForm({
      otp: '',
      signupVerificationToken: '',
      email: '',
      expiresAt: '',
      signupOtp: '',
      signupData: null,
    });
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
    if (loginNeedsVerification) {
      setLoginNeedsVerification(false);
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const handleLoginOtpChange = (e) => {
    const { value } = e.target;
    setLoginOtpForm((prev) => ({
      ...prev,
      otp: value,
    }));
    if (errors.otp || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        otp: '',
        submit: '',
      }));
    }
  };

  const handleSignupVerificationChange = (e) => {
    const { value } = e.target;
    setSignupVerificationForm((prev) => ({
      ...prev,
      otp: value,
    }));
    if (errors.otp || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        otp: '',
        submit: '',
      }));
    }
  };

  const handleForgotChange = (e) => {
    const { value } = e.target;
    setForgotForm({ email: value });
    if (errors.email || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        email: '',
        submit: '',
      }));
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name] || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
        submit: '',
      }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};

    if (!loginForm.email.trim()) {
      newErrors.email = "Email or username is required";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    const hasPasswordComplexity =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(signupForm.password);

    if (!signupForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!signupForm.password) {
      newErrors.password = "Password is required";
    } else if (signupForm.password.length < 8 || !hasPasswordComplexity) {
      newErrors.password = passwordRuleMessage;
    }

    if (!signupForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotPassword = () => {
    const newErrors = {};
    if (!forgotForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(forgotForm.email)) {
      newErrors.email = "Email is invalid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginOtp = () => {
    const newErrors = {};

    if (!loginOtpForm.otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupVerification = () => {
    const newErrors = {};

    if (!signupVerificationForm.otp.trim()) {
      newErrors.otp = "Verification code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetPassword = () => {
    const newErrors = {};
    const hasPasswordComplexity =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(resetForm.password);

    if (!resetForm.token.trim()) {
      newErrors.token = "Reset token is required";
    }

    if (!resetForm.password) {
      newErrors.password = "Password is required";
    } else if (resetForm.password.length < 8 || !hasPasswordComplexity) {
      newErrors.password = passwordRuleMessage;
    }

    if (!resetForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (resetForm.password !== resetForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (validateLogin() && !isLoading) {
      const formData = {
        email: loginForm.email,
        password: loginForm.password
      };
      
      if (onLogin) {
        try {
          const loginResult = await onLogin(formData);
          if (loginResult?.requiresOtp) {
            setLoginOtpForm({
              otp: '',
              loginOtpToken: loginResult.loginOtpToken || '',
              email: formData.email.trim(),
              expiresAt: loginResult.expiresAt || '',
              loginOtp: loginResult.loginOtp || '',
            });
            setStatusMessage(
              loginResult.message || `A one-time code was sent to ${formData.email.trim()}.`
            );
            setErrors({});
          }
        } catch (error) {
          const message = error?.message || "Login failed. Please try again.";
          const requiresVerification = /email not verified/i.test(message);
          setLoginNeedsVerification(requiresVerification);
          setErrors(prev => ({
            ...prev,
            submit: message
          }));
        }
      }
    }
  };

  const handleLoginOtpSubmit = async (e) => {
    e.preventDefault();

    if (!validateLoginOtp() || isLoading) {
      return;
    }

    if (!onVerifyLoginOtp) {
      setErrors((prev) => ({
        ...prev,
        submit: "Login OTP verification is not configured yet.",
      }));
      return;
    }

    try {
      await onVerifyLoginOtp({
        loginOtpToken: loginOtpForm.loginOtpToken,
        otp: loginOtpForm.otp.trim(),
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "OTP verification failed. Please try again.",
      }));
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (validateSignup() && !isLoading) {
      const formData = {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        confirmPassword: signupForm.confirmPassword
      };
      
      if (onSignup) {
        try {
          const signupResult = await onSignup(formData);
          if (signupResult?.requiresEmailVerification) {
            setSignupVerificationForm({
              otp: '',
              signupVerificationToken: signupResult.signupVerificationToken || '',
              email: formData.email.trim(),
              expiresAt: signupResult.expiresAt || '',
              signupOtp: signupResult.signupOtp || '',
              signupData: formData,
            });
            setStatusMessage(
              signupResult.message || `A verification code was sent to ${formData.email.trim()}.`
            );
            setErrors({});
          }
        } catch (error) {
          setErrors(prev => ({
            ...prev,
            submit: error?.message || "Signup failed. Please try again."
          }));
        }
      }
    }
  };

  const handleSignupVerificationSubmit = async (e) => {
    e.preventDefault();

    if (!validateSignupVerification() || isLoading) {
      return;
    }

    if (!onVerifySignupEmail) {
      setErrors((prev) => ({
        ...prev,
        submit: "Signup email verification is not configured yet.",
      }));
      return;
    }

    try {
      const verificationResult = await onVerifySignupEmail({
        signupVerificationToken: signupVerificationForm.signupVerificationToken,
        otp: signupVerificationForm.otp.trim(),
        signupForm: signupVerificationForm.signupData,
      });
      resetSignupVerificationStep();
      if (verificationResult?.existingAccountVerified || verificationResult?.canLogin) {
        setLoginNeedsVerification(false);
        setIsLogin(true);
        setLoginForm((prev) => ({
          ...prev,
          email: verificationResult.email || signupVerificationForm.email || prev.email,
          password: "",
        }));
        setStatusMessage(
          verificationResult.message || "Email verified. You can now sign in."
        );
      } else {
        setStatusMessage('');
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Verification failed. Please try again.",
      }));
    }
  };

  const handleStartAccountVerification = async () => {
    if (!onResendSignupVerification || isLoading || !loginForm.email.trim()) {
      return;
    }

    try {
      const result = await onResendSignupVerification(loginForm.email.trim());
      setSignupVerificationForm({
        otp: '',
        signupVerificationToken: result.signupVerificationToken || '',
        email: loginForm.email.trim(),
        expiresAt: result.expiresAt || '',
        signupOtp: result.signupOtp || '',
        signupData: null,
      });
      setLoginNeedsVerification(false);
      setStatusMessage(
        result.message || `A verification code was sent to ${loginForm.email.trim()}.`
      );
      setErrors({});
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Failed to send verification code.",
      }));
    }
  };

  const handleResendSignupVerification = async () => {
    if (!onResendSignupVerification || isLoading || !signupVerificationForm.email) {
      return;
    }

    try {
      const result = await onResendSignupVerification(signupVerificationForm.email.trim());
      setSignupVerificationForm((prev) => ({
        ...prev,
        otp: '',
        signupVerificationToken: result.signupVerificationToken || prev.signupVerificationToken,
        expiresAt: result.expiresAt || prev.expiresAt,
        signupOtp: result.signupOtp || '',
      }));
      setStatusMessage(result.message || `A new verification code was sent to ${signupVerificationForm.email.trim()}.`);
      setErrors({});
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Failed to resend verification code.",
      }));
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validateForgotPassword() || isLoading) {
      return;
    }

    if (!onForgotPassword) {
      setErrors((prev) => ({
        ...prev,
        submit: "Forgot-password is not configured yet.",
      }));
      return;
    }

    try {
      const responseMessage = await onForgotPassword(forgotForm.email.trim());
      setStatusMessage(responseMessage || "If an account exists, a reset link has been sent.");
      setErrors({});
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setResetForm((prev) => ({ ...prev, token: prev.token || '' }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Failed to request password reset.",
      }));
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validateResetPassword() || isLoading) {
      return;
    }

    if (!onResetPassword) {
      setErrors((prev) => ({
        ...prev,
        submit: "Reset-password is not configured yet.",
      }));
      return;
    }

    try {
      const responseMessage = await onResetPassword({
        token: resetForm.token.trim(),
        password: resetForm.password,
        confirmPassword: resetForm.confirmPassword,
      });

      setStatusMessage(responseMessage || "Password reset successful. Please sign in.");
      setErrors({});
      setShowResetPassword(false);
      setIsLogin(true);
      setShowPassword(false);
      setResetForm({
        token: '',
        password: '',
        confirmPassword: '',
      });
      setLoginForm((prev) => ({
        ...prev,
        password: '',
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || "Failed to reset password.",
      }));
    }
  };

  const handleDemoLoginClick = () => {
    if (!isLoading && onDemoLogin) {
      onDemoLogin();
    }
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setShowResetPassword(false);
    setLoginOtpForm({
      otp: '',
      loginOtpToken: '',
      email: '',
      expiresAt: '',
      loginOtp: '',
    });
    resetSignupVerificationStep();
    setStatusMessage('');
    setErrors({});
    setLoginNeedsVerification(false);
    setForgotForm({ email: loginForm.email || '' });
  };

  const openLoginView = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setLoginOtpForm({
      otp: '',
      loginOtpToken: '',
      email: '',
      expiresAt: '',
      loginOtp: '',
    });
    resetSignupVerificationStep();
    setStatusMessage('');
    setErrors({});
    setLoginNeedsVerification(false);
    setIsLogin(true);
    setShowPassword(false);
  };

  return (
    <div id="auth-section" className="w-full">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Form Section */}
          <div className="p-6 sm:p-8 lg:p-12 order-1">
            <div className="flex justify-center mb-6 sm:mb-8">
              {showForgotPassword || showResetPassword || isLoginOtpStep || isSignupVerificationStep ? (
                <button
                  type="button"
                  onClick={openLoginView}
                  disabled={isLoading}
                  className={`text-sm font-medium text-[#3D9B9B] hover:text-[#2D8B8B] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Back to sign in
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (!isLoading) {
                        setIsLogin(true);
                        resetSignupVerificationStep();
                        setErrors({});
                        setStatusMessage('');
                      }
                    }}
                    disabled={isLoading}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                      isLogin
                        ? "bg-[#3D9B9B] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      if (!isLoading) {
                        setIsLogin(false);
                        resetSignupVerificationStep();
                        setErrors({});
                        setStatusMessage('');
                      }
                    }}
                    disabled={isLoading}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                      !isLogin
                        ? "bg-[#3D9B9B] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {statusMessage && (
              <p className="mb-4 text-sm text-green-700 dark:text-green-400 text-center">
                {statusMessage}
              </p>
            )}

            {showForgotPassword ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                    Forgot your password?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Enter your account email to receive a reset link or token.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={forgotForm.email}
                      onChange={handleForgotChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>

                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}
              </form>
            ) : showResetPassword ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                    Reset Password
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Enter your reset token and choose a new password.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    name="token"
                    value={resetForm.token}
                    onChange={handleResetChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                      errors.token ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Paste your reset token"
                  />
                  {errors.token && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.token}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={resetForm.password}
                      onChange={handleResetChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={resetForm.confirmPassword}
                      onChange={handleResetChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>

                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}
              </form>
            ) : isSignupVerificationStep ? (
              <form onSubmit={handleSignupVerificationSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                    {isExistingAccountActivation ? "Activate Your Account" : "Verify Your Email"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    {isExistingAccountActivation
                      ? `Enter the verification code sent to ${signupVerificationForm.email || "your email"} to activate your existing account.`
                      : `Enter the signup code sent to ${signupVerificationForm.email || "your email"} to finish creating your account.`}
                  </p>
                  {signupVerificationForm.expiresAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                      Code expires at {new Date(signupVerificationForm.expiresAt).toLocaleString()}.
                    </p>
                  )}
                  {signupVerificationForm.signupOtp && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 text-center mb-4">
                      Development OTP: <span className="font-semibold">{signupVerificationForm.signupOtp}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Email Verification Code
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="otp"
                      value={signupVerificationForm.otp}
                      onChange={handleSignupVerificationChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.otp ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="123456"
                      autoComplete="one-time-code"
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.otp}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Verifying..."
                    : isExistingAccountActivation
                      ? "Verify Email"
                      : "Verify Email & Create Account"}
                </Button>

                <button
                  type="button"
                  onClick={handleResendSignupVerification}
                  disabled={isLoading || !onResendSignupVerification}
                  className={`w-full text-sm font-medium text-[#3D9B9B] hover:text-[#2D8B8B] ${
                    isLoading || !onResendSignupVerification ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Resend verification code
                </button>

                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}
              </form>
            ) : isLoginOtpStep ? (
              <form onSubmit={handleLoginOtpSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                    Verify Login OTP
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Enter the one-time code sent to {loginOtpForm.email || "your email"}.
                  </p>
                  {loginOtpForm.expiresAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                      Code expires at {new Date(loginOtpForm.expiresAt).toLocaleString()}.
                    </p>
                  )}
                  {loginOtpForm.loginOtp && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 text-center mb-4">
                      Development OTP: <span className="font-semibold">{loginOtpForm.loginOtp}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    One-Time Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="otp"
                      value={loginOtpForm.otp}
                      onChange={handleLoginOtpChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.otp ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="123456"
                      autoComplete="one-time-code"
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.otp}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}
              </form>
            ) : isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Email Or Username
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="you@example.com or your username"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.password
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded text-[#3D9B9B] focus:ring-[#3D9B9B]"
                      disabled={isLoading}
                    />
                    <span className={`ml-2 text-xs sm:text-sm ${isLoading ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className={`text-xs sm:text-sm text-[#3D9B9B] hover:text-[#2D8B8B] text-left sm:text-right ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Sign In"}
                </Button>
                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}
                {loginNeedsVerification && (
                  <button
                    type="button"
                    onClick={handleStartAccountVerification}
                    disabled={isLoading || !onResendSignupVerification}
                    className={`w-full text-sm font-medium text-[#3D9B9B] hover:text-[#2D8B8B] ${
                      isLoading || !onResendSignupVerification ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Send verification code
                  </button>
                )}

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleDemoLoginClick}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Try Demo Version"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      value={signupForm.name}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.password
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    className="mt-1 rounded text-[#3D9B9B] focus:ring-[#3D9B9B] flex-shrink-0"
                    required
                    disabled={isLoading}
                  />
                  <span className={`ml-2 text-xs sm:text-sm ${isLoading ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-[#3D9B9B] hover:text-[#2D8B8B]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-[#3D9B9B] hover:text-[#2D8B8B]"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                {errors.submit && (
                  <p className="text-sm text-red-600 text-center -mt-2">
                    {errors.submit}
                  </p>
                )}

                <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoading) {
                        setIsLogin(true);
                        setErrors({});
                      }
                    }}
                    className={`text-[#3D9B9B] hover:text-[#2D8B8B] font-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-br from-[#3D9B9B] to-[#2D8B8B] p-6 sm:p-8 lg:p-12 text-white order-2 lg:order-2">
            <div className="h-full flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                {isLogin
                  ? "Welcome Back!"
                  : "Join Thousands of Productive Users"}
              </h2>

              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <FiCheck className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">
                      Smart Task Management
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm">
                      Organize your tasks with smart categorization and
                      priority levels.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <FiBell className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">
                      Automated Reminders
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm">
                      Never miss a deadline with smart, automated reminder
                      system.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <FiTrendingUp className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">
                      Productivity Analytics
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm">
                      Track your progress and improve your productivity
                      with insights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 sm:pt-8 border-t border-white/20">
                <blockquote className="italic text-white/90 text-sm sm:text-base">
                  "Noxa helped our team increase productivity by 40% in
                  just 3 months. The automated reminders are a
                  game-changer!"
                </blockquote>
                <div className="mt-3 sm:mt-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0"></div>
                  <div className="ml-3">
                    <div className="font-medium text-sm sm:text-base">Sarah Johnson</div>
                    <div className="text-xs sm:text-sm text-white/70">
                      Product Manager at TechCorp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
