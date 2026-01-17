import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button", // Add type prop
  disabled = false,
  iconColor = "",
}) => {
  const baseStyles =
    "font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#3D9B9B] text-white hover:bg-[#2d7b7b]",
    secondary: "bg-white text-[#B88E2F] border border-[#3D9B9B] hover:bg-gray-50",
    secondaryPro: "bg-transparent text-black hover:text-white hover:bg-[#3D9B9B]",
    soft: "bg-[#f0f2f5] text-gray-700 hover:bg-[#e5e7eb] rounded-xl shadow-md text-[#3D9B9B]",
    artifitial: "bg-transparent text-[#3D9B9B] hover:text-[#2d7b7b]",
    icon: "bg-transparent hover:bg-gray-100 hover:text-[#3D9B9B] text-gray-600 rounded-lg p-2 transition-colors border border-gray-200",
    cta: "bg-[#f0f2f5] rounded-xl shadow-md text-[#3D9B9B]"
  };

  const sizes = {
    xs: "text-xs px-2 py-2",
    sm: "text-sm px-4 py-2.5 ",
    md: "text-base px-6 py-3",
    lg: "text-lg px-12 py-4",
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button 
      type={type} // Use the type prop
      onClick={onClick} 
      className={buttonStyles}
      disabled={disabled}
      style={iconColor ? { '--icon-color': iconColor } : {}}
    >
      {children}
    </button>
  );
};

export default Button;