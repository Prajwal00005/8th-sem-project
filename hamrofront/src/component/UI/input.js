export const Input = ({ label, error, className = '', ...props }) => {
  return (
      <div className="space-y-1">
          {label && (
              <label className="block text-sm font-medium text-[#2C3B2A]">
                  {label}
              </label>
          )}
          <input
              className={`w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2.5 rounded-lg
              placeholder:text-[#94A898] focus:outline-none focus:border-[#395917] focus:ring-1 
              focus:ring-[#395917] disabled:bg-gray-50 disabled:text-gray-500 
              transition-colors ${error ? 'border-red-500' : ''} ${className}`}
              {...props}
          />
          {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
      </div>
  );
};