export const Card = ({ children, title, className = '', ...props }) => {
  return (
      <div 
          className={`bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden ${className}`}
          {...props}
      >
          {title && (
              <div className="px-6 py-4 border-b border-[#E8EFEA]">
                  <h3 className="text-lg font-medium text-[#2C3B2A]">{title}</h3>
              </div>
          )}
          <div className="p-6">
              {children}
          </div>
      </div>
  );
};