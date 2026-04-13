import React, { useState } from "react";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiHome,
  FiSettings,
  FiBox,
  FiTrendingUp,
  FiLayers,
  FiGrid,
} from "react-icons/fi";
import { BiMoney } from "react-icons/bi";
import {
  FaPeopleGroup,
  FaMoneyBillTransfer,
  FaMoneyCheck,
} from "react-icons/fa6";
import { VscFeedback } from "react-icons/vsc";
import { RiUserCommunityLine } from "react-icons/ri";
import { AiOutlineWechatWork } from "react-icons/ai";
import { FaBlog, FaChartLine } from "react-icons/fa";

export const DashboardLayout = ({
  title,
  sidebarItems,
  renderContent,
  currentPage,
  setCurrentPage,
  handleLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getIcon = (label) => {
    switch (label.toLowerCase()) {
      case "dashboard":
        return <FiTrendingUp />;
      case "settings":
        return <FiSettings />;
      case "profile":
        return <FiUser />;
      case "payment settings":
        return <BiMoney />;
      case "user management":
        return <FaPeopleGroup />;
      case "admin management":
        return <FaPeopleGroup />;
      case "manage visitors":
        return <FaPeopleGroup />;
      case "visitors":
        return <FaPeopleGroup />;
      case "complaints":
        return <VscFeedback />;
      case "community":
        return <RiUserCommunityLine />;
      case "messages":
        return <AiOutlineWechatWork />;
      case "rent payment":
        return <FaMoneyBillTransfer />;
      case "security payment":
        return <FaMoneyBillTransfer />;
      case "subscription":
        return <FaMoneyCheck />;
      case "blog management":
        return <FaBlog />;
      case "reports":
        return <FaChartLine />;
      default:
        return <FiGrid />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-300"
      >
        {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${isCollapsed ? "w-20" : "w-72"} fixed lg:relative h-full bg-white/90 backdrop-blur-sm border-r border-slate-200 z-40 transition-all duration-300 flex flex-col overflow-x-hidden  ${!isMobileMenuOpen && isCollapsed ? "lg:block hidden" : ""} ${isMobileMenuOpen ? "block" : "lg:block hidden"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FiLayers className="text-white text-lg" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {title || "Dashboard"}
                  </h1>
                  <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsMobileMenuOpen(false);
              }}
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation - scrollable list only */}
        <nav className="flex-1 p-2 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentPage(item.page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                  currentPage === item.page
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <span
                  className={`text-lg ${currentPage === item.page ? "text-blue-600" : "text-slate-400"}`}
                >
                  {getIcon(item.label)}
                </span>
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-200 space-y-1">
          <button
            onClick={() => {
              setCurrentPage("profile");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-xl flex items-center gap-4 transition-all duration-200 ${
              currentPage === "profile"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <FiUser
              className={`text-lg ${currentPage === "profile" ? "text-blue-600" : "text-slate-400"}`}
            />
            {!isCollapsed && <span className="font-medium">Profile</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-xl flex items-center gap-4 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <FiLogOut className="text-lg" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};
