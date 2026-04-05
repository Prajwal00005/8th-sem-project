import { Link, Routes, Route } from "react-router-dom"
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
} from "react-icons/fa"
import BlogSection from "../InfoBlog/blogSection"
import BlogDetail from "../InfoBlog/blogDetail"
import FeatureCard from "../UI/featureCard"

export default function Infoblog() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F8F6]">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#2C3B2A]">HamroSamaj</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-600 hover:text-[#2C3B2A] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("blog")}
              className="text-sm font-medium text-gray-600 hover:text-[#2C3B2A] transition-colors"
            >
              Blog
            </button>
            <Link
              to="/login"
              className="bg-[#2C3B2A] text-white px-4 py-2 rounded-lg hover:bg-[#3D513B] transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Hero Section */}
                <section className="w-full py-24 bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9]">
                  <div className="container mx-auto px-6">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                      <div className="space-y-4">
                        <div className="inline-block bg-[#F5F8F6] px-4 py-1.5 text-sm text-[#2C3B2A] font-medium rounded-full">
                          Apartment Management Made Simple
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#2C3B2A]">
                          Simplify Your Apartment Management
                        </h1>
                        <p className="max-w-[600px] text-gray-600 text-base">
                          Streamline operations, enhance resident experience, and build a stronger community with our
                          comprehensive apartment management system.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          <Link
                            to="/login"
                            className="bg-[#2C3B2A] text-white px-6 py-3 rounded-lg hover:bg-[#3D513B] transition-colors flex items-center shadow-lg"
                          >
                            Get Started <FaChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => scrollToSection("features")}
                            className="border border-gray-200 text-[#2C3B2A] px-6 py-3 rounded-lg hover:bg-[#F5F8F6] transition-colors"
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                      <div className="relative h-[350px] rounded-xl overflow-hidden shadow-2xl">
                        <img
                          src="https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                          alt="Apartment building"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2C3B2A]/30 to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div className="inline-block bg-[#F5F8F6] px-4 py-1.5 rounded-full text-sm text-[#2C3B2A] font-medium mb-4">
                        Features
                      </div>
                      <h2 className="text-4xl font-bold text-[#2C3B2A] mb-4">
                        Everything You Need to Manage Your Property
                      </h2>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Our platform provides comprehensive tools for property managers and residents alike.
                      </p>
                    </div>
                    <div className="mx-auto grid gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
                      <FeatureCard
                        icon={<FaUsers className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Property Management"
                        description="Easily manage multiple properties, units, and common areas from a single dashboard."
                      />
                      <FeatureCard
                        icon={<FaUsers className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Community Hub"
                        description="A social circle for all apartment members to connect, share updates, and engage in real-time chat."
                      />
                      <FeatureCard
                        icon={<FaCalendar className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Payment Tracking"
                        description="Track and manage payments for all users, including rent and utilities, with clear visibility and reminders."
                      />
                      <FeatureCard
                        icon={<FaShieldAlt className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Security Management"
                        description="Control access to buildings, monitor security systems, and manage visitor tracking to ensure resident safety."
                      />
                      <FeatureCard
                        icon={<FaUsers className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Resident Portal"
                        description="Give residents access to pay rent, submit maintenance requests, and communicate with management."
                      />
                      <FeatureCard
                        icon={<FaBrain className="h-10 w-10 text-[#2C3B2A]" />}
                        title="Sentiment Analysis"
                        description="Advanced complaint management with AI-powered sentiment analysis to prioritize and address resident concerns."
                      />
                    </div>
                  </div>
                </section>

                {/* Blog Section */}
                <section id="blog" className="py-24 bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9]">
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div className="inline-block bg-[#F5F8F6] px-4 py-1.5 rounded-full text-sm text-[#2C3B2A] font-medium mb-4">
                        Blog
                      </div>
                      <h2 className="text-4xl font-bold text-[#2C3B2A] mb-4">
                        Latest Updates & Insights
                      </h2>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stay informed with the latest news, tips, and community stories.
                      </p>
                    </div>
                    <BlogSection />
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 bg-white">
                  <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                      <div className="inline-block bg-[#F5F8F6] px-4 py-1.5 rounded-full text-sm text-[#2C3B2A] font-medium mb-4">
                        Testimonials
                      </div>
                      <h2 className="text-4xl font-bold text-[#2C3B2A] mb-4">
                        What Our Clients Say
                      </h2>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Hear from property managers and residents who have transformed their communities with HamroSamaj.
                      </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      <div className="bg-[#F5F8F6] p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-[#2C3B2A] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            R
                          </div>
                          <div className="ml-4">
                            <h4 className="font-semibold text-[#2C3B2A]">Ram Pd. Khaka</h4>
                            <p className="text-sm text-gray-600">Property Manager</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">
                          "HamroSamaj has completely transformed how we manage our properties. The payment tracking has saved us countless hours."
                        </p>
                        <div className="mt-4 flex text-yellow-500">
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                        </div>
                      </div>
                      <div className="bg-[#F5F8F6] p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-[#2C3B2A] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            S
                          </div>
                          <div className="ml-4">
                            <h4 className="font-semibold text-[#2C3B2A]">Sita Adhikari</h4>
                            <p className="text-sm text-gray-600">Resident</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">
                          "The Community Hub makes it easy to connect with neighbors and stay updated. I love the real-time chat!"
                        </p>
                        <div className="mt-4 flex text-yellow-500">
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                        </div>
                      </div>
                      <div className="bg-[#F5F8F6] p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-[#2C3B2A] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            P
                          </div>
                          <div className="ml-4">
                            <h4 className="font-semibold text-[#2C3B2A]">Pramesh Katuwal</h4>
                            <p className="text-sm text-gray-600">Property Owner</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">
                          "The analytics and reporting features give me clear insights into our operations, helping me make better decisions."
                        </p>
                        <div className="mt-4 flex text-yellow-500">
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
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
                <span className="text-xl font-bold text-[#2C3B2A]">HamroSamaj</span>
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
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
                  <a href="#" className="text-gray-600 hover:text-[#2C3B2A] transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2C3B2A] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2C3B2A] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#2C3B2A] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C3B2A] mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest updates.</p>
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
  )
}