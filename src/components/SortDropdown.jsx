// components/SortDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiCalendar, FiActivity, FiBook, FiEdit, FiCheckCircle, FiChevronLeft } from "react-icons/fi";

const SortDropdown = ({
  options = [
    { id: "deadline", label: "By deadline", icon: <FiCalendar /> },
    { id: "progress", label: "By progress", icon: <FiActivity /> },
    { id: "category", label: "By category", icon: <FiBook /> },
    { id: "title", label: "By title", icon: <FiEdit /> },
  ],
  selectedOption = "deadline",
  onSelect = () => {},
  buttonLabel = "Sort by",
  buttonIcon = <FiCalendar />,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    onSelect(optionId);
    setIsOpen(false);
  };

  const selectedOptionData = options.find(opt => opt.id === selectedOption);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Sort Dropdown Button */}
      <button
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {buttonIcon}
        {selectedOptionData?.label || buttonLabel}
        <FiChevronLeft className={`text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-90' : '-rotate-90'
        }`} />
      </button>
      
      {/* Sort Dropdown Menu - NO HEIGHT RESTRICTIONS */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg  border border-gray-200 z-40 py-2 animate-fadeIn shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                selectedOption === option.id ? "text-blue-600 bg-blue-50" : "text-gray-700"
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
              {selectedOption === option.id && (
                <FiCheckCircle className="ml-auto text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;