import React from 'react';
import { FiLoader } from 'react-icons/fi'; // Add this import

const Input = ({
  type = "text",
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  icon,
  iconPosition = "left",
  size = "medium", // small, medium, large
  error = "", // validation error message
  disabled = false,
  loading = false, // show a spinner
}) => {
  // Size styles
  const sizeClasses = {
    small: "text-sm py-1 px-3 rounded-md",
    medium: "text-base py-2 px-4 rounded-lg",
    large: "text-lg py-3 px-5 rounded-xl",
  };

  const paddingLeft = icon && iconPosition === "left" ? "pl-10" : "";
  const paddingRight = icon && iconPosition === "right" ? "pr-10" : "";

  return (
    <div className="relative w-full">
      {/* Left icon */}
      {icon && iconPosition === "left" && !loading && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}

      {/* Input element */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={`
          w-full border bg-white border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${sizeClasses[size]}
          ${paddingLeft} ${paddingRight}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${error ? "border-red-500 focus:ring-red-200" : "border-gray-300"}
          ${className}
        `}
      />

      {/* Right icon or loading spinner */}
      {loading ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin">
          <FiLoader className="w-5 h-5" />
        </div>
      ) : (
        icon &&
        iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )
      )}

      {/* Error message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;