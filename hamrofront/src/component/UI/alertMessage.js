import React, { useEffect } from 'react';

const AlertMessage = ({ message, type = 'error', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    if (type === 'error') {
      return 'bg-red-50 border-red-100 text-red-600';
    }
    return 'bg-[#00ED64]/10 border-[#00ED64]/20 text-[#00ED64]';
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={`${getStyles()} border rounded-lg p-4 shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[300px]`}>
        <span className="flex-grow text-center font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AlertMessage;