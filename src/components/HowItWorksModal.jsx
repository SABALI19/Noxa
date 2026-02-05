import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const HowItWorksModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Close modal on outside click
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Prevent scrolling on modal content
  const handleModalScroll = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-2 md:p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Modal Container - FULL SCREEN ON MOBILE */}
      <div
        ref={modalRef}
        className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Mobile optimized */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] text-white">
          <div className="flex-1 min-w-0">
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl md:text-3xl font-bold truncate"
            >
              How Noxa Works
            </h2>
            <p className="text-white/80 text-xs sm:text-sm truncate">
              Your AI-powered productivity companion
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1 sm:p-2 rounded-full hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close modal"
          >
            <X size={isMobile ? 20 : 24} className="stroke-[2]" />
          </button>
        </div>

        {/* Modal Content - Scrollable area */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
          onScroll={handleModalScroll}
        >
          {/* Steps Container */}
          <div className="space-y-6 sm:space-y-8">
            {/* Step 1 */}
            <div className="flex flex-col gap-4 sm:gap-6 items-start group">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#3D9B9B] to-[#2D7A7A] text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-[#3D9B9B] transition-colors">
                  AI Analyzes Your Productivity
                </h3>
              </div>
              <div className="pl-0 sm:pl-16">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Noxa's AI continuously monitors your work patterns, system performance, 
                  and task completion to identify potential issues before they impact you. 
                  It proactively prevents productivity drops by alerting you about 
                  bottlenecks, deadline risks, and optimization opportunities.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-4 sm:gap-6 items-start group">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#3D9B9B] to-[#2D7A7A] text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-[#3D9B9B] transition-colors">
                  AI Discovers Your Patterns
                </h3>
              </div>
              <div className="pl-0 sm:pl-16">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Noxa learns your daily routines, work habits, and repetitive tasks, 
                  then automates them seamlessly. From organizing files and scheduling 
                  follow-ups to prioritizing emails, Noxa handles everything in the 
                  background. Configure once and let Noxa handle the rest forever.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-4 sm:gap-6 items-start group">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#3D9B9B] to-[#2D7A7A] text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-[#3D9B9B] transition-colors">
                  AI-Powered Task Assistance
                </h3>
              </div>
              <div className="pl-0 sm:pl-16">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Simply ask Noxa to handle complex tasks. Draft professional emails, 
                  prepare meeting agendas, summarize weekly reports, analyze data, 
                  or create presentations - Noxa processes your requests and delivers 
                  polished results in seconds. Your AI assistant is always ready.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-[#3D9B9B]">✓</span> Stay Ahead, Always
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Noxa's predictive analytics keep you ahead of problems before 
                  they happen. Receive smart notifications about potential issues 
                  and get recommendations to optimize your workflow.
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-[#3D9B9B]">✓</span> Set Once, Forget Forever
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Once configured, Noxa runs autonomously. It adapts to your 
                  changing needs and continuously improves its automation based 
                  on your feedback and work patterns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-4 sm:p-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
              Ready to transform your productivity?{" "}
              <a
                href="/signup"
                className="text-[#3D9B9B] hover:underline font-medium"
              >
                Get started with Noxa
              </a>
            </p>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] text-white font-medium rounded-lg hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3D9B9B] focus:ring-offset-2 text-sm sm:text-base"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;