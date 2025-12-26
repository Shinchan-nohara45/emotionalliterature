import React from "react";

export function Badge({ 
  children, 
  className = "", 
  variant = "default",
  ...props 
}) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";
  
  const variants = {
    default: "bg-purple-100 text-purple-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 bg-transparent text-gray-700"
  };
  
  const variantClass = variants[variant] || variants.default;
  
  return (
    <span
      className={`${baseStyles} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

