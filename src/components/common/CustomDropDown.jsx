import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const CustomDropdown = ({ items = [], onSelect }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div className="relative w-fit" ref={dropdownRef}>
      {/* Trigger (ONLY ICON) */}
      <FiChevronDown
        onClick={() => setOpen(!open)}
        className={`text-gray-700 dark:text-gray-300 text-xl cursor-pointer transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />

      {/* Dropdown Menu */}
      {open && (
        <div
          className="absolute right-0 mt-2 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     rounded-md shadow-md z-50 animate-fadeIn"
        >
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (onSelect) onSelect(item.value);
                setOpen(false);
              }}
              className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;