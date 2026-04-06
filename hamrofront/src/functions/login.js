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
    <div className="min-h-screen bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9] flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9] opacity-90"></div>
      <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-radial from-[#395917] via-[#395917]/20 to-transparent opacity-30 blur-[60px] top-10 left-5"></div>
      <div className="absolute w-[200px] h-[200px] rounded-full bg-gradient-radial from-[#85AA9B] via-[#85AA9B]/20 to-transparent opacity-20 blur-[40px] bottom-10 right-10"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#395917] to-[#2C3B2A] rounded-lg mb-3">
              <span className="text-white text-2xl font-bold">H</span>
            </div>
            <h1 className="text-xl font-bold text-[#2C3B2A] mb-2">Welcome Back!</h1>
            <p className="text-[#5C7361] text-sm">Secure access to your account</p>
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