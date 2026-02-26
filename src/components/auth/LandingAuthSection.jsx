import React, { useEffect, useState } from "react";
import { GiRobotGolem } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import Auth from "../../forms/Auth";
import { useAuth } from "../../hooks/UseAuth";

const LandingAuthSection = ({
  onLogin,
  onSignup,
  requestedMode = "login",
  onLoadingChange,
}) => {
  const navigate = useNavigate();
  const { loginWithBackend, signupWithBackend } = useAuth();

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

  const handleAuthLogin = async (formData) => {
    try {
      startLoading(25);
      const loggedInUser = await loginWithBackend({
        email: formData.email,
        password: formData.password,
      });
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

  const handleAuthSignup = async (formData) => {
    try {
      startLoading(25);
      const newUser = await signupWithBackend({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
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
                Thank you for choosing Noxa!
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Preparing your personalized workspace...
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
          onSignup={handleAuthSignup}
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
