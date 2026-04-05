import React, { useState } from 'react';
import axios from '../utils/axiosConfig';
import { Link,useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AlertMessage from '../component/UI/alertMessage';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [apartmentOptions, setApartmentOptions] = useState([]);
  const [selectedApartment, setSelectedApartment] = useState('');
  const [showApartmentSelect, setShowApartmentSelect] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { username: identifier, password };  // 'username' includes email or username
    if (selectedApartment) {
      payload.apartmentName = selectedApartment;
    }

    try {
      const response = await axios.post('/api/v1/login/', payload);
      const { token, role, apartmentName, username } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      localStorage.setItem('apartmentName', apartmentName);

      switch (role) {
        case 'superadmin':
          navigate('/superadmin-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'resident':
          navigate('/resident-dashboard');
          break;
        case 'security':
          navigate('/security-dashboard');
          break;
        default:
          console.error('Unknown role:', role);
      }
    } catch (error) {
      if (error.response && error.response.status === 300) {
        setApartmentOptions(error.response.data.apartments);
        setShowApartmentSelect(true);
      } else {
        console.error('Error logging in:', error.response ? error.response.data : error.message);
        setError('Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden font-['Helvetica Neue']">
      <div className="absolute inset-0 bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9]"></div>
      
      <div className="absolute w-[1200px] h-[1200px] rounded-full bg-gradient-radial from-[#85AA9B] via-[#85AA9B]/20 to-transparent opacity-30 blur-[80px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#395917] via-[#395917]/10 to-transparent opacity-20 blur-[60px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="absolute w-[900px] h-[900px] rounded-full bg-[#85AA9B] opacity-5 blur-[130px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="absolute w-[900px] h-[900px] rounded-full bg-[#3D513B] opacity-20 blur-[130px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#2F3E2D] opacity-15 blur-[110px] top-1/3 right-1/4"></div>

      {error && (
        <div className="absolute top-4 right-4 z-50">
          <AlertMessage
            message={error}
            type="error"
            onClose={() => setError('')}
            duration={5000}
            className="bg-white/90 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg 
            backdrop-blur-sm font-medium text-sm flex items-center gap-2"
          />
        </div>
      )}
      
      <div className="relative z-10 w-full max-w-lg p-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-10 shadow-xl border border-[#D8E3DC]">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-normal text-[#2C3B2A] tracking-wide mb-2 font-['Cormorant']">
              HAMROSAMAJ
            </h1>
            <p className="text-[#5C7361] text-sm font-light tracking-wide">
              Welcome back! Let’s get you logged in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                  focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                  placeholder:text-[#94A898] text-base"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username or Email"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                  focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                  placeholder:text-[#94A898] text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#5C7361] hover:text-[#395917]"
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {showApartmentSelect && (
                <select
                  className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                  focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                  placeholder:text-[#94A898] text-base"
                  value={selectedApartment}
                  onChange={(e) => setSelectedApartment(e.target.value)}
                  required
                >
                  <option value="">Select Your Residence</option>
                  {apartmentOptions.map((apt) => (
                    <option key={apt} value={apt} className="text-[#2C3B2A] bg-[#F5F8F6]">
                      {apt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 border-white/10 rounded-md bg-white/5 checked:bg-[#ffffff] focus:ring-0 transition-colors"
                />
                <span className="text-hgreen text-sm ">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgotPassword')}
                className="text-hgreen hover:text-[#4a521e] text-sm font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="mt-6 w-full bg-[#2C3B2A] hover:bg-[#3D513B] text-white py-4 rounded-xl font-medium 
              transition-all duration-300 text-base shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
            <div className="text-center mt-4">
              <Link
                to="/"
                className="text-[#5C7361] hover:text-[#395917] hover:underline text-sm font-light transition-colors"
              >
                Want to know more? Click here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;