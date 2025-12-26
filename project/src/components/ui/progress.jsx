import React from "react";

export function Progress({ 
  value = 0, 
  className = "",
  ...props 
}) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-in-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

