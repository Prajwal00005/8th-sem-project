export const Button = ({ children, variant = 'primary', icon: Icon, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200";
  
  const variants = {
      primary: "bg-[#395917] hover:bg-[#2C3B2A] text-white shadow-sm",
      secondary: "bg-[#F5F8F6] hover:bg-[#E8EFEA] text-[#2C3B2A] border border-[#D8E3DC]",
      outline: "border border-[#D8E3DC] hover:bg-[#F5F8F6] text-[#2C3B2A]",
      danger: "bg-red-50 hover:bg-red-100 text-red-600",
  };

  return (
      <button
          className={`${baseStyles} ${variants[variant]} ${className}`}
          {...props}
      >
          {Icon && <Icon className="w-5 h-5" />}
          {children}
      </button>
  );
};