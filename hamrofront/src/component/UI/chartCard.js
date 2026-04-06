import React from 'react';

const ChartCard = ({ title, description, children, footer }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="p-3">{children}</div>
      {footer && (
        <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100">
          <p className="text-xs text-slate-600">{footer}</p>
        </div>
      )}
    </div>
  );
};

export default ChartCard;