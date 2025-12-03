import React from 'react'
import { FiSearch } from "react-icons/fi"

const Input = ({
  type = "text",
  value,
  onChange,
  placeholder = "Search tasks, notes, reminders..",
  className = "",
  icon, // Make icon optional with default
  iconPosition = "left", // Add icon position
}) => {
  return (
    <div className="relative w-full">
      {icon && iconPosition === "left" && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
      
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full border bg-white border-gray-300 rounded-2xl text-sm font-ro
          ${icon && iconPosition === "left" ? 'pl-10 pr-3' : 'px-3'}
          
          py-1 focus:outline-none  focus:ring-2 focus:ring-gray-200
          ${className}
        `}
      />
      
      {icon && iconPosition === "right" && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
    </div>
  )
}

export default Input