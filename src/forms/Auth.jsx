// src/forms/Auth.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiCheck, FiBell, FiTrendingUp, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../components/Button';

const Auth = ({ onLogin, onSignup, onDemoLogin, initialIsLogin = true, isLoading = false }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
  };

  const validateLogin = () => {
    const newErrors = {};

    if (!loginForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};

    if (!signupForm.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!signupForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!signupForm.password) {
      newErrors.password = "Password is required";
    } else if (signupForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!signupForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    if (validateLogin() && !isLoading) {
      const formData = {
        email: loginForm.email,
        password: loginForm.password
      };
      
      if (onLogin) {
        onLogin(formData);
      }
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    if (validateSignup() && !isLoading) {
      const formData = {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        confirmPassword: signupForm.confirmPassword
      };
      
      if (onSignup) {
        onSignup(formData);
      }
    }
  };

  const handleDemoLoginClick = () => {
    if (!isLoading && onDemoLogin) {
      onDemoLogin();
    }
  };

  return (
    <div id="auth-section" className="w-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Form Section */}
          <div className="p-6 sm:p-8 lg:p-12 order-1">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => !isLoading && setIsLogin(true)}
                  disabled={isLoading}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    isLogin
                      ? "bg-[#3D9B9B] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Login
                </button>
                <button
                  onClick={() => !isLoading && setIsLogin(false)}
                  disabled={isLoading}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    !isLogin
                      ? "bg-[#3D9B9B] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className={`ml-2 text-xs sm:text-sm ${isLoading ? 'text-gray-400' : 'text-gray-600'}`}>
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
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

                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={signupForm.name}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.name ? "border-red-500" : "border-gray-300"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:border-transparent outline-none ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span className={`ml-2 text-xs sm:text-sm ${isLoading ? 'text-gray-400' : 'text-gray-600'}`}>
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

                <p className="text-center text-xs sm:text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => !isLoading && setIsLogin(true)}
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