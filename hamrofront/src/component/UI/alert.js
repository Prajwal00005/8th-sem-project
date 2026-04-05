import React from 'react';

export const Alert = ({ 
  children, 
  variant = "error",
  className = "" 
}) => {
  const variants = {
    error: "bg-red-100 border-red-400 text-red-700",
    success: "bg-green-100 border-green-400 text-green-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    info: "bg-blue-100 border-blue-400 text-blue-700"
  };

  return (
    <div className={`${variants[variant]} border px-4 py-3 rounded relative ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm ${className}`}>
      {children}
    </p>
  );
};

export default Alert;