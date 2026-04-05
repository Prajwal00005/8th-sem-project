import React from 'react';

const ChartCard = ({ title, description, children, footer }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#2C3B2A]">{title}</h3>
        <p className="text-sm text-[#5C7361]">{description}</p>
      </div>
      <div className="h-[300px]">{children}</div>
      {footer && (
        <div className="mt-4 text-sm text-[#5C7361]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartCard;