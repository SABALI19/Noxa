import React, { useState } from "react";
import { GiRobotGolem } from "react-icons/gi";
import { useNavigate, Link } from "react-router-dom";
import Noxalogo from "../assets/logo-items/logo-dark-transparent.png";
import Auth from "../forms/Auth";
import {
  FiCheck,
  FiCalendar,
  FiBell,
  FiTarget,
  FiArrowRight,
  FiMenu,
  FiX,
  FiClock,
  FiShield,
} from "react-icons/fi";
import Button from "../components/Button";
import HeroLayout from "../components/HeroLayout";
import { Bot, ChartNoAxesColumnIncreasing, TrendingUp, TriangleAlert, Workflow, Zap } from "lucide-react";
import CalanderTask from "../assets/img/calendar-and-tasks.svg"
import ModernChat from "../assets/img/Modern-chat.png"
import Approval from "../assets/img/Approval-interface.svg"
import Testimonials from "../components/Testimonials";
import { useAuth } from "../hooks/UseAuth";

const LandingPage = ({ onLogin, onSignup }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

const simulateLoading = () => {
  return new Promise((resolve) => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    const startTime = Date.now();
    const totalDuration = 1500;
    let animationFrameId;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setLoadingProgress(progress);
      
      if (progress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        cancelAnimationFrame(animationFrameId);
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProgress(0);
          resolve(true);
        }, 150);
      }
    };
    
    updateProgress();
  });
};

  const handleUserLogin = async (userData) => {
    try {
      await simulateLoading();
      
      login(userData);
      
      if (onLogin) {
        onLogin(userData);
      }
      
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await simulateLoading();
      
      const demoUser = {
        id: "demo-123",
        name: "Demo User",
        email: "demo@example.com",
        role: "Administrator",
        avatar: null,
      };

      await handleUserLogin(demoUser);
    } catch (error) {
      console.error("Demo login error:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleAuthLogin = async (formData) => {
    try {
      await simulateLoading();
      
      const userData = {
        id: Date.now().toString(),
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        role: "Administrator",
        avatar: null,
        createdAt: new Date().toISOString(),
      };

      await handleUserLogin(userData);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleAuthSignup = async (formData) => {
    try {
      await simulateLoading();
      
      const userData = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: "Member",
        avatar: null,
        createdAt: new Date().toISOString(),
      };

      await handleUserLogin(userData);
      
      if (onSignup) {
        onSignup(userData);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const featureHighlights = [
    {
      icon: <Bot className="w-5 h-5 text-[#3D9B9B]" />,
      title: "Ai Task assistant",
      description: "Delegate writing, researching and planning tasks to AI that understands context.",
    },
    {
      icon: <FiBell className="w-5 h-5 text-[#3D9B9B]" />,
      title: "Smart reminders",
      description: "Ai learns your pattern and reminds you at the perfect time.",
    },
    {
      icon: <FiTarget className="w-5 h-5 text-[#3D9B9B]" />,
      title: "Goal Tracking",
      description: "Automatic progress tracking with intelligent milestone suggestions.",
    },
    {
      icon: <FiCalendar className="w-5 h-5 text-gray-400" />,
      title: "Calendar Integration",
      description: "Seamless sync with all your calendars and scheduling tools.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#3D9B9B]" />,
      title: "Workflow Automation",
      description: "Create custom workflows that run automatically based on triggers.",
    },
    {
      icon: <ChartNoAxesColumnIncreasing className="w-5 h-5 text-[#3D9B9B]" />,
      title: "Productivity Insights",
      description: "Data-driven insights to help you optimize your work patterns and habits.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Loading Overlay */}
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

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link to="/landing">
                <img
                  src={Noxalogo}
                  alt="noxa logo"
                  className="h-10 md:h-12 w-auto cursor-pointer"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/features"
                className="text-gray-700 hover:text-[#3D9B9B] transition-colors"
              >
                Features
              </Link>

              <Link
                to="/how-it-works"
                className="text-gray-700 hover:text-[#3D9B9B] transition-colors"
              >
                How it works
              </Link>

              <Link
                to="/pricing"
                className="text-gray-700 hover:text-[#3D9B9B] transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-[#3D9B9B] transition-colors"
              >
                About
              </Link>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => {
                  setIsLogin(true);
                  document
                    .getElementById("auth-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${
                  isLogin
                    ? "bg-[#3D9B9B] text-white"
                    : "text-gray-700 hover:text-[#3D9B9B]"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  document
                    .getElementById("auth-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${
                  !isLogin
                    ? "bg-[#3D9B9B] text-white"
                    : "text-gray-700 hover:text-[#3D9B9B]"
                }`}
              >
                Sign Up
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-700 hover:text-[#3D9B9B] p-2"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/features"
                  className="text-gray-700 hover:text-[#3D9B9B] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>

                <Link
                  to="/how-it-works"
                  className="text-gray-700 hover:text-[#3D9B9B] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it works
                </Link>

                <Link
                  to="/pricing"
                  className="text-gray-700 hover:text-[#3D9B9B] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>

                <Link
                  to="/about"
                  className="text-gray-700 hover:text-[#3D9B9B] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - FIXED RESPONSIVE */}
      <div className="bg-[#3d9c9c] min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center min-h-[calc(100vh-4rem)] py-12 lg:py-20">
            {/* Left content - Takes full width on mobile, 3 cols on desktop */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="max-w-2xl mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-roboto font-medium text-gray-900 leading-tight mb-6">
                    Your AI Assistant That Actually Does The Work
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-100 mb-8 lg:mb-10">
                    The all-in-one productivity platform that helps you manage
                    tasks, set reminders, track goals, and boost your productivity
                    with smart automation.
                  </p>

                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
                    <Button
                      variant="cta"
                      size="md"
                      onClick={handleDemoLogin}
                      className="flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Try Demo Version"}
                      {!isLoading && <FiArrowRight />}
                    </Button>
                    <Button
                      variant="icon"
                      size="lg"
                      onClick={() =>
                        document
                          .getElementById("auth-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      disabled={isLoading}
                    >
                      See how it works
                    </Button>
                  </div>

                  {/* Trial section */}
                  <div className="text-center lg:text-left">
                    <p className="text-sm font-sans font-medium text-gray-200 mb-4">
                      Free 14-day trial ∘ No credit card needed
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-6">
                      <p className="flex text-gray-100 items-center text-sm font-sans font-medium gap-1">
                        <FiClock />
                        5-10 hrs saved weekly
                      </p>

                      <p className="flex text-gray-100 items-center text-sm font-sans font-medium gap-1">
                        <GiRobotGolem />
                        AI Powered
                      </p>

                      <p className="flex text-gray-100 items-center text-sm font-sans font-medium gap-1">
                        <FiShield />
                        Secure & Private
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right HeroLayout - Shows above content on mobile, beside on desktop */}
            <div className="lg:col-span-2 flex items-center justify-center order-1 lg:order-2">
              <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md">
                <HeroLayout />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-[#f7f8fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="py-12 md:py-16">
            {/* Header Section */}
            <div className="text-center mb-12 lg:mb-16">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-roboto font-semibold text-gray-900 mb-4">
                Meet Your AI Productivity Partner
              </h1>
              <p className="text-lg sm:text-xl font-sans font-medium text-gray-500 max-w-3xl mx-auto px-4">
                Noxa doesn't just remind you—it performs tasks for you
              </p>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Section 1: Delegate, Don't Do */}
              <div className="space-y-6 rounded-2xl p-6 lg:p-8 bg-white">
                <div className="bg-[#ebf5f5] p-4 w-16 rounded-2xl">
                  <GiRobotGolem className="text-3xl m-auto text-[#3d9c9c]" />
                </div>
                <h2 className="text-lg font-roboto font-bold text-gray-900">
                  Delegate, Don't Do
                </h2>
                <p className="text-sm text-gray-700">
                  Ask Noxa to draft emails, prepare agendas, or summarize your week. AI handles it in seconds.
                </p>

                <div className="bg-gray-100 rounded-xl shadow-sm p-4">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="text-xs text-gray-500">
                      AI is typing...
                    </div>
                  </div>
                  <p className="text-gray-800 text-xs font-sans">
                    Draft follow-up email for client meeting? Email ready for review
                  </p>
                </div>
              </div>

              {/* Section 2: Workflows That Run Themselves */}
              <div className="space-y-6 rounded-2xl p-6 lg:p-8 bg-white">
                <div className="bg-[#f0f4fa] p-4 w-16 rounded-2xl">
                  <Workflow className="text-3xl m-auto text-[#3d9c9c]" />
                </div>
                <h2 className="text-lg font-roboto font-bold text-gray-900">
                  Workflows That Run Themselves
                </h2>
                <p className="text-sm text-gray-700">
                  AI discovers your patterns and automates repetitive tasks. Set once, forget forever.
                </p>

                <div className="bg-gray-100 rounded-xl shadow-sm p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-gray-500">Pattern detected</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-700 text-xl">⇨</span>
                      <span className="text-gray-700 text-xs">Auto-scheduled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Know Before You Need To */}
              <div className="space-y-6 rounded-2xl p-6 lg:p-8 bg-white md:col-span-2 lg:col-span-1">
                <div className="bg-[#f0f4fa] p-4 w-16 rounded-2xl">
                  <TrendingUp className="text-3xl m-auto text-[#3d9c9c]" />
                </div>
                <h2 className="text-lg font-roboto font-bold text-gray-900">
                  Know Before You Need To
                </h2>
                <p className="text-sm text-gray-700">
                  AI analyzes your productivity and prevents problems before they happen. Stay ahead, always.
                </p>

                <div className="bg-gray-100 rounded-xl shadow-sm p-4">
                  <div className="flex items-center mb-2 gap-2">
                    <TriangleAlert className="text-amber-400 w-4 h-4" />
                    <p className="text-xs text-gray-500">
                      Workflow spike predicted
                    </p>
                  </div>
                  <p className="text-gray-700 text-xs">
                    Suggesting task redistribution for next week
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Motivation Section */}
          <div className="py-12 md:py-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-roboto">
                Three Steps to Ten Hours Per Week
              </h3>
            </div>

            {/* Motivation cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="border flex flex-col items-center p-6 text-center rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-[#0c7d7d] text-white rounded-full text-2xl font-bold">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect To Your Work</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Sync your calendar, tasks, and notes. Noxa learns your workflow in minutes.
                </p>
                <div className="w-full mt-auto flex justify-center bg-gray-50 p-6 rounded-lg">
                  <img 
                    src={CalanderTask} 
                    alt="Calendar and tasks"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="border flex flex-col items-center p-6 text-center rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-[#6b9ad1] text-white rounded-full text-2xl font-bold">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">Delegate to AI</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Ask Noxa to handle routine works, drafts, summaries, scheduling. Just talk naturally
                </p>
                <div className="w-full mt-auto flex justify-center bg-gray-50 p-6 rounded-lg">
                  <img 
                    src={ModernChat} 
                    alt="Modern chat interface"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="border flex flex-col items-center p-6 text-center rounded-lg bg-white hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-[#0c7d7d] rounded-full text-white text-2xl font-bold">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">Review and Approve</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  AI shows its work. You stay in control. One click to approve or refine
                </p>
                <div className="w-full mt-auto flex justify-center bg-gray-50 p-6 rounded-lg">
                  <img 
                    src={Approval} 
                    alt="Approval interface"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features Preview Section */}
          <div className="py-12 md:py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need Powered by AI
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 px-4">
                Discover powerful features designed to boost your productivity
              </p>
              <Link
                to="/features"
                className="text-[#3D9B9B] hover:text-[#2D8B8B] font-medium inline-flex items-center text-sm sm:text-base"
              >
                Explore All Features
                <FiArrowRight className="ml-2" />
              </Link>
            </div>

            {/* Feature grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureHighlights.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#3D9B9B]/30 hover:shadow-lg transition-all"
                >
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-[#3D9B9B]/10 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold font-roboto text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About Preview */}
          <div className="py-12 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  About Noxa
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Founded in 2022, Noxa was created by a team of productivity
                  enthusiasts who believed there had to be a better way to
                  organize work. Our mission is to empower individuals and teams
                  to achieve their full potential through intelligent
                  productivity tools.
                </p>
                <p className="text-gray-600 text-sm sm:text-base mb-8">
                  Today, thousands of users across 50+ countries trust Noxa to
                  help them stay organized, focused, and productive.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="primary" onClick={() => navigate("/about")}>
                    Learn More About Us
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/about#team")}
                  >
                    Meet Our Team
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#3D9B9B] to-[#2D8B8B] rounded-2xl p-6 sm:p-8 text-white order-1 lg:order-2">
                <div className="text-center">
                  <div className="text-5xl sm:text-6xl mb-6">🚀</div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">
                    Join Our Community
                  </h3>
                  <p className="opacity-90 mb-6 text-sm sm:text-base">
                    Be part of a growing community of productive individuals and
                    teams.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">50+</div>
                      <div className="text-xs sm:text-sm opacity-80">Countries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">10K+</div>
                      <div className="text-xs sm:text-sm opacity-80">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">99.9%</div>
                      <div className="text-xs sm:text-sm opacity-80">Uptime</div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/about")}
                    className="w-full"
                  >
                    Discover Our Story
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section - FIXED RESPONSIVE */}
          <div className="py-12 md:py-16">
            <Testimonials />
          </div>

          {/* Auth Section - FIXED RESPONSIVE */}
          <div id="auth-section" className="py-12 md:py-16">
            <Auth 
              onLogin={handleAuthLogin}
              onSignup={handleAuthSignup}
              onDemoLogin={handleDemoLogin}
              initialIsLogin={isLogin}
              isLoading={isLoading}
            />
          </div>

          {/* Footer */}
          <footer className="py-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-2">
                <Link to="/landing">
                  <img src={Noxalogo} alt="noxa logo" className="h-8 w-auto" />
                </Link>
                <span className="text-lg sm:text-xl font-bold text-gray-900">Noxa</span>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <Link
                  to="/features"
                  className="text-gray-600 hover:text-[#3D9B9B] text-sm sm:text-base"
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-gray-600 hover:text-[#3D9B9B] text-sm sm:text-base"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-[#3D9B9B] text-sm sm:text-base"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-[#3D9B9B] text-sm sm:text-base"
                >
                  Contact
                </Link>
              </div>

              <div className="text-gray-600 text-xs sm:text-sm">
                © 2024 Noxa. All rights reserved.
              </div>
            </div>

            {/* Bottom Links */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <Link to="/privacy" className="hover:text-[#3D9B9B]">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-[#3D9B9B]">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="hover:text-[#3D9B9B]">
                  Cookie Policy
                </Link>
                
                  href="mailto:support@noxa.com"
                  className="hover:text-[#3D9B9B]"
                
                  support@noxa.com
                </div>
              </div>
            
          </footer>
        </div>
      </div>
    </div>
  );
};

LandingPage.defaultProps = {
  onLogin: null,
  onSignup: null,
};

export default LandingPage;