import React, { useEffect, useState } from "react";
import { GiRobotGolem } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import Auth from "../../forms/Auth";
import { useAuth } from "../../hooks/UseAuth";
import { useNotifications } from "../../hooks/useNotifications";

const LandingAuthSection = ({
  onLogin,
  onSignup,
  requestedMode = "login",
  onLoadingChange,
}) => {
  const navigate = useNavigate();
  const { loginWithBackend, verifyLoginOtpWithBackend, signupWithBackend, forgotPassword, resetPassword } = useAuth();
  const { addNotification } = useNotifications();

  const isLogin = requestedMode !== "signup";
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (typeof onLoadingChange === "function") {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const startLoading = (progress = 20) => {
    setIsLoading(true);
    setLoadingProgress(progress);
  };

  const finishLoading = () => {
    setLoadingProgress(100);
    setIsLoading(false);
    setLoadingProgress(0);
  };

  const failLoading = () => {
    setIsLoading(false);
    setLoadingProgress(0);
  };

  const emitAuthNotification = (authResult, fallbackType, fallbackTitle, fallbackMessage) => {
    const user = authResult?.user || {};
    const backendNotification = authResult?.notification;
    const defaultItem = {
      id: user.id || user._id || Date.now(),
      title: user.username || user.name || user.email || "Account",
    };

    if (backendNotification) {
      addNotification(
        backendNotification.notificationType || fallbackType,
        backendNotification.item || defaultItem,
        null,
        true,
        {
          source: "api",
          eventId: backendNotification.eventId || undefined,
          timestamp: backendNotification.timestamp || undefined,
          itemType: backendNotification.itemType || "account",
          templateOverride: {
            title: backendNotification.title || fallbackTitle,
            message:
              backendNotification.message ||
              authResult?.message ||
              fallbackMessage,
            type: "success",
          },
        }
      );
      return;
    }

    addNotification(fallbackType, defaultItem, null, true, {
      source: "api",
      itemType: "account",
      templateOverride: {
        title: fallbackTitle,
        message: authResult?.message || fallbackMessage,
        type: "success",
      },
    });
  };

  const handleAuthLogin = async (formData) => {
    try {
      startLoading(25);
      const loginResult = await loginWithBackend({
        email: formData.email,
        password: formData.password,
      });
      if (loginResult?.requiresOtp) {
        finishLoading();
        return loginResult;
      }

      const loggedInUser = loginResult?.user || loginResult;
      emitAuthNotification(
        loginResult,
        "user_logged_in",
        "Login Successful",
        `Welcome back ${loggedInUser?.username || "there"}, you logged in successfully.`
      );
      setLoadingProgress(85);
      if (onLogin) {
        onLogin(loggedInUser);
      }
      finishLoading();
      navigate("/dashboard");
      return loggedInUser;
    } catch (error) {
      console.error("Login error:", error);
      failLoading();
      throw new Error(error?.message || "Login failed. Please try again.");
    }
  };

  const handleVerifyLoginOtp = async ({ loginOtpToken, otp }) => {
    try {
      startLoading(45);
      const loginResult = await verifyLoginOtpWithBackend({ loginOtpToken, otp });
      const loggedInUser = loginResult?.user || loginResult;
      emitAuthNotification(
        loginResult,
        "user_logged_in",
        "Login Successful",
        `Welcome back ${loggedInUser?.username || "there"}, you logged in successfully.`
      );
      setLoadingProgress(85);
      if (onLogin) {
        onLogin(loggedInUser);
      }
      finishLoading();
      navigate("/dashboard");
      return loggedInUser;
    } catch (error) {
      console.error("Login OTP verification error:", error);
      failLoading();
      throw new Error(error?.message || "OTP verification failed. Please try again.");
    }
  };

  const handleAuthSignup = async (formData) => {
    try {
      startLoading(25);
      const signupResult = await signupWithBackend({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      const newUser = signupResult?.user || signupResult;
      emitAuthNotification(
        signupResult,
        "account_created",
        "Account Created",
        `Welcome ${newUser?.username || "there"}, your account was created successfully.`
      );
      setLoadingProgress(85);
      if (onSignup) {
        onSignup(newUser);
      }
      finishLoading();
      navigate("/dashboard");
      return newUser;
    } catch (error) {
      console.error("Signup error:", error);
      failLoading();
      throw new Error(error?.message || "Signup failed. Please try again.");
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      startLoading(35);
      const message = await forgotPassword(email);
      finishLoading();
      return message;
    } catch (error) {
      failLoading();
      throw new Error(error?.message || "Failed to request password reset.");
    }
  };

  const handleResetPassword = async ({ token, password, confirmPassword }) => {
    try {
      startLoading(35);
      const message = await resetPassword({ token, password, confirmPassword });
      finishLoading();
      return message;
    } catch (error) {
      failLoading();
      throw new Error(error?.message || "Failed to reset password.");
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 border-4 border-[#3D9B9B]/20 border-t-[#3D9B9B] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-[#3D9B9B] rounded-full flex items-center justify-center">
                    <GiRobotGolem className="text-white text-2xl" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-roboto">
                Processing request...
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Please wait a moment.
              </p>
              <div className="space-y-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3D9B9B] to-[#2D8B8B] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="flex text-sm text-gray-500">
                  <span>Initializing</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="auth-section" className="py-12 md:py-16">
        <Auth
          onLogin={handleAuthLogin}
          onVerifyLoginOtp={handleVerifyLoginOtp}
          onSignup={handleAuthSignup}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
          initialIsLogin={isLogin}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

LandingAuthSection.defaultProps = {
  onLogin: null,
  onSignup: null,
  requestedMode: "login",
  onLoadingChange: null,
};

export default LandingAuthSection;
