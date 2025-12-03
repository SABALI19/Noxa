import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
}) => {
  const baseStyles =
    "font-semibold transition-all duration-300";

  const variants = {
    primary: "bg-[#3D9B9B] text-white",
    secondary: "bg-white text-[#B88E2F] border border-[#3D9B9B]",
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-base px-8 py-3",
    lg: "text-lg px-12 py-4",
  };

  const buttonStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button onClick={onClick} className={buttonStyles}>
      {children}
    </button>
  );
};

export default Button;
