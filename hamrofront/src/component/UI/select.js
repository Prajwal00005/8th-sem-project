export const Select = ({ label, value, onChange, options, className, required, placeholder }) => {
  return (
      <div className="space-y-1">
          {label && (
              <label className="block text-sm font-medium text-[#2C3B2A]">
                  {label}
              </label>
          )}
          <select
              value={value}
              onChange={onChange}
              required={required}
              className={`w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2.5 rounded-lg
              focus:outline-none focus:border-[#395917] focus:ring-1 focus:ring-[#395917]
              disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${className}`}
          >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((option) => (
                  <option key={option.value} value={option.value}>
                      {option.label}
                  </option>
              ))}
          </select>
      </div>
  );
};