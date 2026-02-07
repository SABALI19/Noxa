import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  iconColor = "",
}) => {
  const baseStyles =
    "font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#3D9B9B] text-white hover:bg-[#2d7b7b] dark:bg-[#3D9B9B] dark:hover:bg-[#2d7b7b]",
    
    secondary: "bg-white dark:bg-gray-800 text-[#B88E2F] dark:text-[#3D9B9B] border border-[#3D9B9B] dark:border-[#3D9B9B] hover:bg-gray-50 dark:hover:bg-gray-700",
    
    secondaryPro: "bg-transparent text-black dark:text-gray-300 hover:text-white hover:bg-[#3D9B9B] dark:hover:text-white dark:hover:bg-[#3D9B9B]",
    
    soft: "bg-[#f0f2f5] dark:bg-gray-800 text-[#3D9B9B] dark:text-[#3D9B9B] hover:bg-[#e5e7eb] dark:hover:bg-gray-700 rounded-xl shadow-md",
    
    artifitial: "bg-transparent text-[#3D9B9B] hover:text-[#2d7b7b] dark:text-[#3D9B9B] dark:hover:text-[#2d7b7b]",
    
    icon: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#3D9B9B] dark:hover:text-[#3D9B9B] text-gray-600 dark:text-gray-400 rounded-lg p-2 transition-colors border border-gray-200 dark:border-gray-700",
    
    cta: "bg-[#f0f2f5] dark:bg-gray-800 rounded-xl shadow-md text-[#3D9B9B] dark:text-[#3D9B9B] hover:bg-gray-200 dark:hover:bg-gray-700"
  };

  const sizes = {
    xs: "text-xs px-2 py-2",
    sm: "text-sm px-4 py-2.5",
    md: "text-base px-6 py-3",
    lg: "text-lg px-12 py-4",
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button 
      type={type}
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