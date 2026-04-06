import React, { useState } from "react";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiHome,
  FiSettings,
  FiBox,
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

  const getIcon = (label) => {
    switch (label.toLowerCase()) {
      case "dashboard":
        return <FiHome />;
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
        return <FiBox />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#D8E3DC] to-[#C5D1C9]">
      <aside
        className={`${isCollapsed ? "w-20" : "w-64"} bg-[#2C3B2A] 
                shadow-xl transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 text-2xl font-bold text-white/90 flex items-center justify-between">
          {!isCollapsed && (title || "Dashboard")}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isCollapsed ? <FiMenu size={24} /> : <FiX size={24} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-2 mt-4">
            {sidebarItems.map((item, index) => (
              <li
                key={index}
                onClick={() => setCurrentPage(item.page)}
                className={`px-6 py-4 cursor-pointer flex items-center gap-4
                                    ${
                                      currentPage === item.page
                                        ? "bg-white/20 text-white"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                    } transition-all duration-200`}
              >
                <span className="text-xl">{getIcon(item.label)}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-4 mb-6">
          <ul className="space-y-2">
            <li
              onClick={() => setCurrentPage("profile")}
              className={`px-6 py-4 cursor-pointer flex items-center gap-4
                                ${
                                  currentPage === "profile"
                                    ? "bg-white/20 text-white"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                                } transition-all duration-200`}
            >
              <FiUser className="text-xl" />
              {!isCollapsed && <span>Profile</span>}
            </li>
            <li
              onClick={handleLogout}
              className="px-6 py-4 cursor-pointer flex items-center gap-4 
                            text-white/70 hover:bg-red-500/20 hover:text-red-100 transition-all duration-200"
            >
              <FiLogOut className="text-xl" />
              {!isCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex-grow overflow-y-auto p-8 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};
