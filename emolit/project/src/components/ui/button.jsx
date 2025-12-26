import React from "react";

export function Button({ 
  children, 
  className = "", 
  variant = "default", 
  size = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-purple-600 text-white hover:bg-purple-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
  };
  
  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
    icon: "p-2"
  };
  
  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.default;
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

