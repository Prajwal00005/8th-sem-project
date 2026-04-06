import { Link, Routes, Route } from "react-router-dom";
import {
  FaUsers,
  FaCalendar,
  FaShieldAlt,
  FaArrowRight,
  FaChevronRight,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaBrain,
  FaBars,
  FaTimes,
  FaStar,
  FaHome,
  FaBuilding,
  FaChartLine,
  FaLock,
  FaComments,
  FaHandshake,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { useState, useEffect } from "react";
import BlogSection from "../InfoBlog/blogSection";
import BlogDetail from "../InfoBlog/blogDetail";
import FeatureCard from "../UI/featureCard";

export default function Infoblog() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "glass-effect shadow-lg" : "glass-effect"}`}
      >
        <div className="container mx-auto px-6 flex h-16 items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#2C3B2A] to-[#3D513B] rounded-lg flex items-center justify-center">
              <FaBuilding className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">HamroSamaj</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="nav-link flex items-center gap-2"
            >
              <FaHome className="h-4 w-4" />
              Features
            </button>
            <button
              onClick={() => scrollToSection("blog")}
              className="nav-link flex items-center gap-2"
            >
              <FaComments className="h-4 w-4" />
              Blog
            </button>
            <Link
              to="/login"
              className="bg-blue-500 backdrop-blur-md text-white px-2 py-1 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md border "
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="container mx-auto px-6 py-4 space-y-3">
                <button
                  onClick={() => scrollToSection("features")}
                  className="nav-link flex items-center gap-2 w-full text-left"
                >
                  <FaHome className="h-4 w-4" />
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("blog")}
                  className="nav-link flex items-center gap-2 w-full text-left"
                >
                  <FaComments className="h-4 w-4" />
                  Blog
                </button>
                <Link
                  to="/login"
                  className="bg-green-800 flex items-center gap-2 w-full justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started <FaArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Hero Section */}
                <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src="https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                      alt="Apartment building"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
                  </div>

                  {/* Centered Content */}
                  <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                      >
                        <div
                          className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30"
                          data-aos="fade-right"
                        >
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                          <span className="text-xs font-semibold text-white">
                            Smart Apartment Management
                          </span>
                        </div>

                        <div className="space-y-3">
                          <h1
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight"
                            data-aos="fade-up"
                            data-aos-delay="200"
                          >
                            Simplify Your
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                              Apartment Living
                            </span>
                          </h1>

                          <p
                            className="text-sm sm:text-base text-white/90 leading-relaxed max-w-xl mx-auto"
                            data-aos="fade-up"
                            data-aos-delay="400"
                          >
                            The modern way to manage your apartment community.
                            Connect with neighbors, track payments, and enjoy
                            hassle-free living.
                          </p>
                        </div>

                        <div
                          className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
                          data-aos="fade-up"
                          data-aos-delay="600"
                        >
                          <Link
                            to="/login"
                            className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                          >
                            Get Started Now
                          </Link>
                          <button
                            onClick={() => scrollToSection("features")}
                            className="border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300"
                          >
                            Explore Features
                          </button>
                        </div>

                        {/* Stats */}
                        <div
                          className="grid grid-cols-3 gap-4 md:gap-6 pt-8 max-w-lg mx-auto"
                          data-aos="fade-up"
                          data-aos-delay="800"
                        >
                          <div className="text-center">
                            <div className="text-xl md:text-2xl font-bold text-white">
                              500+
                            </div>
                            <div className="text-xs text-white/80">
                              Properties
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl md:text-2xl font-bold text-white">
                              10K+
                            </div>
                            <div className="text-xs text-white/80">
                              Happy Residents
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl md:text-2xl font-bold text-white">
                              99%
                            </div>
                            <div className="text-xs text-white/80">
                              Satisfaction Rate
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div
                        className="inline-flex items-center bg-[#F5F8F6] px-6 py-3 rounded-full text-sm text-[#2C3B2A] font-medium mb-6"
                        data-aos="fade-up"
                      >
                        <FaStar className="h-4 w-4 mr-2 text-yellow-500" />
                        Features
                      </div>
                      <h2
                        className="text-4xl md:text-5xl font-bold text-[#2C3B2A] mb-6"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        Everything You Need to
                        <span className="block text-gradient">
                          Manage Your Property
                        </span>
                      </h2>
                      <p
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        Our platform provides comprehensive tools for property
                        managers and residents alike.
                      </p>
                    </div>
                    <div className="mx-auto grid gap-8 py-8 md:grid-cols-2 lg:grid-cols-3">
                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaBuilding className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Property Management
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Easily manage multiple properties, units, and common
                          areas from a single dashboard.
                        </p>
                      </div>

                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="300"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaUsers className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Community Hub
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          A social circle for all apartment members to connect,
                          share updates, and engage in real-time chat.
                        </p>
                      </div>

                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaCalendar className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Payment Tracking
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Track and manage payments for all users, including
                          rent and utilities, with clear visibility and
                          reminders.
                        </p>
                      </div>

                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="500"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaShieldAlt className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Security Management
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Control access to buildings, monitor security systems,
                          and manage visitor tracking to ensure resident safety.
                        </p>
                      </div>

                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="600"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaHome className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Resident Portal
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Give residents access to pay rent, submit maintenance
                          requests, and communicate with management.
                        </p>
                      </div>

                      <div
                        className="feature-card"
                        data-aos="fade-up"
                        data-aos-delay="700"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <FaBrain className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C3B2A] mb-3">
                          Sentiment Analysis
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Advanced complaint management with AI-powered
                          sentiment analysis to prioritize and address resident
                          concerns.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Blog Section */}
                <section
                  id="blog"
                  className="py-24 bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9]"
                >
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div
                        className="inline-flex items-center bg-white/90 backdrop-blur px-6 py-3 rounded-full text-sm text-[#2C3B2A] font-medium mb-6"
                        data-aos="fade-up"
                      >
                        <FaComments className="h-4 w-4 mr-2 text-purple-600" />
                        Blog
                      </div>
                      <h2
                        className="text-4xl md:text-5xl font-bold text-[#2C3B2A] mb-6"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        Latest Updates &
                        <span className="block text-gradient">
                          Community Insights
                        </span>
                      </h2>
                      <p
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        Stay informed with the latest news, tips, and community
                        stories.
                      </p>
                    </div>
                    <BlogSection />
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 bg-white">
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div
                        className="inline-flex items-center bg-[#F5F8F6] px-6 py-3 rounded-full text-sm text-[#2C3B2A] font-medium mb-6"
                        data-aos="fade-up"
                      >
                        <FaStar className="h-4 w-4 mr-2 text-yellow-500" />
                        Testimonials
                      </div>
                      <h2
                        className="text-4xl md:text-5xl font-bold text-[#2C3B2A] mb-6"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        What Our
                        <span className="block text-gradient">
                          Happy Clients Say
                        </span>
                      </h2>
                      <p
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        Hear from property managers and residents who have
                        transformed their communities with HamroSamaj.
                      </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      <div
                        className="testimonial-card bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                        data-aos="fade-up"
                        data-aos-delay="200"
                      >
                        <div className="flex items-center mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            R
                          </div>
                          <div className="ml-4">
                            <h4 className="font-bold text-[#2C3B2A] text-lg">
                              Ram Pd. Khaka
                            </h4>
                            <p className="text-sm text-gray-600">
                              Property Manager
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 italic leading-relaxed mb-6">
                          "HamroSamaj has completely transformed how we manage
                          our properties. The payment tracking has saved us
                          countless hours."
                        </p>
                        <div className="flex text-yellow-500 text-lg">
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                        </div>
                      </div>

                      <div
                        className="testimonial-card bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                        data-aos="fade-up"
                        data-aos-delay="400"
                      >
                        <div className="flex items-center mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            S
                          </div>
                          <div className="ml-4">
                            <h4 className="font-bold text-[#2C3B2A] text-lg">
                              Sita Adhikari
                            </h4>
                            <p className="text-sm text-gray-600">Resident</p>
                          </div>
                        </div>
                        <p className="text-gray-700 italic leading-relaxed mb-6">
                          "The Community Hub makes it easy to connect with
                          neighbors and stay updated. I love the real-time
                          chat!"
                        </p>
                        <div className="flex text-yellow-500 text-lg">
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                        </div>
                      </div>

                      <div
                        className="testimonial-card bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                        data-aos="fade-up"
                        data-aos-delay="600"
                      >
                        <div className="flex items-center mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            P
                          </div>
                          <div className="ml-4">
                            <h4 className="font-bold text-[#2C3B2A] text-lg">
                              Pramesh Katuwal
                            </h4>
                            <p className="text-sm text-gray-600">
                              Property Owner
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 italic leading-relaxed mb-6">
                          "The analytics and reporting features give me clear
                          insights into our operations, helping me make better
                          decisions."
                        </p>
                        <div className="flex text-yellow-500 text-lg">
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                          <FaStar className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            }
          />
          <Route path="/blog/:id" element={<BlogDetail />} />
        </Routes>
      </main>

      <footer className="w-full border-t py-12 bg-[#F5F8F6]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <span className="text-xl font-bold text-[#2C3B2A]">
                  HamroSamaj
                </span>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="h-4 w-4 text-[#2C3B2A]" />
                  hamosamajapp@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="h-4 w-4 text-[#2C3B2A]" />
                  +977-9815364055
                </li>
                <li className="flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-[#2C3B2A]" />
                  Sundarharaicha-7, Gachhiya
                </li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a
                  href="#"
                  className="text-[#2C3B2A] p-2 rounded-full hover:bg-[#F5F8F6] transition-colors"
                >
                  <FaFacebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-[#2C3B2A] p-2 rounded-full hover:bg-[#F5F8F6] transition-colors"
                >
                  <FaTwitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-[#2C3B2A] p-2 rounded-full hover:bg-[#F5F8F6] transition-colors"
                >
                  <FaInstagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-[#2C3B2A] p-2 rounded-full hover:bg-[#F5F8F6] transition-colors"
                >
                  <FaLinkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C3B2A] mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("blog")}
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Blog
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C3B2A] mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#2C3B2A] transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C3B2A] mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-4">
                Subscribe to our newsletter for the latest updates.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="p-3 border border-gray-200 rounded-l-lg w-full focus:outline-none focus:ring-2 focus:ring-[#2C3B2A] bg-white"
                />
                <button className="bg-[#2C3B2A] text-white p-3 rounded-r-lg hover:bg-[#3D513B] transition-colors">
                  <FaArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>© {new Date().getFullYear()} HamroSamaj. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
