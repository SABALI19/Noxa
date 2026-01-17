import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp",
      content: "Noxa has completely transformed how our team collaborates. The AI suggestions are incredibly accurate and save us hours every week.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Engineer",
      company: "StartupXYZ",
      content: "The workflow automation features are game-changing. I've automated 80% of my repetitive tasks. Highly recommended!",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      role: "Marketing Director",
      company: "GrowthLabs",
      content: "Our team's productivity increased by 40% after implementing Noxa. The insights dashboard is particularly valuable.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    },
    {
      id: 4,
      name: "David Kim",
      role: "Freelancer",
      company: "",
      content: "As a solo entrepreneur, Noxa helps me stay organized and focused. The smart reminders alone are worth the subscription.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    {
      id: 5,
      name: "Priya Sharma",
      role: "CTO",
      company: "InnovateTech",
      content: "Best productivity tool we've adopted. Seamlessly integrates with all our existing tools and the AI is incredibly intuitive.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    },
    {
      id: 6,
      name: "Alex Morgan",
      role: "UX Designer",
      company: "DesignStudio",
      content: "The clean interface and intuitive features make Noxa a joy to use every day. It's become an essential part of my workflow.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef(null);

  // Responsive cards per view
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1; // Mobile
    if (window.innerWidth < 1024) return 2; // Tablet
    return 3; // Desktop
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());
  const totalSlides = Math.ceil(testimonials.length / cardsPerView);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const newCardsPerView = getCardsPerView();
      setCardsPerView(newCardsPerView);
      setIsMobile(window.innerWidth < 768);
      // Reset to first slide on resize to avoid broken states
      setCurrentIndex(0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, totalSlides]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  const StarRating = ({ rating }) => (
    <div className="flex gap-1 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full py-12 md:py-16 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-roboto text-gray-900 mb-2">
            Trusted by Professionals Who Value Their Time  
          </h2>
        </div>

        {/* Testimonial Cards Container */}
        <div 
          className="relative px-8 sm:px-12 md:px-16"
          onMouseEnter={() => setIsMobile ? null : setIsPaused(true)}
          onMouseLeave={() => setIsMobile ? null : setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {/* Create slides */}
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="w-full flex-shrink-0"
                >
                  <div className={`grid gap-4 sm:gap-6 ${
                    cardsPerView === 1 ? 'grid-cols-1' :
                    cardsPerView === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {testimonials
                      .slice(slideIndex * cardsPerView, (slideIndex * cardsPerView) + cardsPerView)
                      .map((testimonial) => (
                        <div
                          key={testimonial.id}
                          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          {/* Stars */}
                          <StarRating rating={testimonial.rating} />
                          
                          {/* Testimonial Text */}
                          <p className="text-gray-700 mb-6 text-sm sm:text-base italic leading-relaxed line-clamp-4">
                            "{testimonial.content}"
                          </p>
                          
                          {/* User Info */}
                          <div className="flex items-center mt-auto">
                            <img
                              src={testimonial.avatar}
                              alt={testimonial.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-semibold font-roboto text-gray-900 text-sm sm:text-base truncate">
                                {testimonial.name}
                              </h4>
                              <p className="text-gray-600 text-xs sm:text-sm truncate">
                                {testimonial.role}
                                {testimonial.company && ` • ${testimonial.company}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 md:p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 md:p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-10 focus:outline-none focus:ring-2 focus:ring-[#3D9B9B]"
            aria-label="Next testimonials"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-8 md:mt-10 space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3D9B9B] focus:ring-offset-2 ${
                index === currentIndex 
                  ? 'bg-[#3D9B9B] w-8 sm:w-10' 
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;