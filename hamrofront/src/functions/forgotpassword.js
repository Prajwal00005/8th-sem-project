import React, { useState } from "react";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (event) => {
    event.preventDefault();
    try {
      await axios.post("/api/v1/requestOTP/", { email });
      toast.success("OTP has been sent to your email.");
      setOtpSent(true);
    } catch (error) {
      console.error(
        "Error sending OTP:",
        error.response ? error.response.data : error.message,
      );
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await axios.post("/api/v1/resetPassword/", { email, otp, newPassword });
      toast.success(
        "Password has been reset successfully. You can now log in with your new password.",
      );
      navigate("/login");
    } catch (error) {
      console.error(
        "Error verifying OTP or resetting password:",
        error.response ? error.response.data : error.message,
      );
      toast.error("Failed to reset password. Please try again.");
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

      <div className="relative z-10 w-full max-w-lg p-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-10 shadow-xl border border-[#D8E3DC]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-normal text-[#2C3B2A] tracking-wide mb-2 font-['Cormorant']">
              Reset Password
            </h1>
            <p className="text-[#5C7361] text-sm font-light tracking-wide">
              {!otpSent
                ? "Don't worry! We'll help you recover your password."
                : "Enter the OTP sent to your email to reset your password."}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                                focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                                placeholder:text-[#94A898] text-base"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#2C3B2A] hover:bg-[#3D513B] text-white py-4 rounded-xl font-medium 
                                transition-all duration-300 text-base shadow-md hover:shadow-lg"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                                focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                                placeholder:text-[#94A898] text-base"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                                focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                                placeholder:text-[#94A898] text-base"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-6 py-4 rounded-xl 
                                focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361] transition-all 
                                placeholder:text-[#94A898] text-base"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#2C3B2A] hover:bg-[#3D513B] text-white py-4 rounded-xl font-medium 
                                transition-all duration-300 text-base shadow-md hover:shadow-lg"
              >
                Reset Password
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-[#395917] hover:text-[#2C3B2A] text-sm font-light transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
