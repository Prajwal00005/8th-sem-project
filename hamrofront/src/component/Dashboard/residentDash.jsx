import React, { useState, useEffect } from "react";
import { useResidentDashboardStore } from "../../store/residentDashboardStore";
import { DashboardLayout } from "../UI/dashboardlayout";
import ProfilePage from "../Profiles/profile";
import RentPayment from "../Payments/rentPayment";
import UserComplaints from "../Complaints/userComplaints";
// import CommunityHub from "../Community/communityHub";
import VisitorSection from "../Management/visitorManagement";
import ResidentBillManagement from "../Management/residentBillManagement";
// import ChatSection from "../chat/chatSection";
import ChartCard from "../UI/chartCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../utils/axiosConfig";

const ResidentDashboard = () => {
  const { currentPage, setCurrentPage, handleLogout } =
    useResidentDashboardStore();
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [activeComplaints, setActiveComplaints] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view data");
          return;
        }
        const config = { headers: { Authorization: `Token ${token}` } };

        const [complaintTrendsRes, complaintsRes] = await Promise.all([
          api
            .get("/api/v1/complaints/resident-trends/", config)
            .catch((err) => ({
              error:
                err.response?.data?.detail ||
                "Failed to fetch complaint trends",
            })),
          api.get("/api/v1/complaints/list", config).catch((err) => ({
            error: err.response?.data?.detail || "Failed to fetch complaints",
          })),
        ]);

        if (complaintTrendsRes.error) {
          console.error("Complaint trends error:", complaintTrendsRes.error);
          setComplaintTrends([]);
        } else {
          setComplaintTrends(complaintTrendsRes.data);
        }

        if (complaintsRes.error) {
          console.error("Complaints error:", complaintsRes.error);
          setActiveComplaints(0);
        } else {
          setActiveComplaints(
            complaintsRes.data.filter((c) => c.status === "in_progress").length,
          );
        }

        if (complaintTrendsRes.error && complaintsRes.error) {
          setError("Failed to load dashboard data. Please try again later.");
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error fetching dashboard data:", err);
        setError("An unexpected error occurred. Please try again later.");
      }
    };
    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-[#2C3B2A] p-3 rounded-lg border border-[#E8EFEA] shadow-sm">
          <p className="font-semibold">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name === "in_progress" ? "In Progress" : entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const sidebarItems = () => [
    { label: "Dashboard", page: "dashboard" },
    { label: "Rent Payment", page: "rent" },
    { label: "Bill Management", page: "bills" },
    { label: "Visitors", page: "visitors" },
    { label: "Complaints", page: "complaints" },
    // { label: "Community", page: "community-hub" },
    // { label: "Messages", page: "chat" },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "rent":
        return <RentPayment />;
      case "bills":
        return <ResidentBillManagement />;
      case "visitors":
        return <VisitorSection userRole="resident" />;
      case "complaints":
        return <UserComplaints />;
      // case "community-hub":
      //   return <CommunityHub />;
      // case "chat":
      //   return <ChatSection />;
      default:
        return (
          <div className="space-y-4 p-4">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Welcome to your personal dashboard
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    {activeComplaints}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800">Active Complaints</h3>
                <p className="text-xs text-slate-500 mt-1">Currently in progress</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    {complaintTrends.reduce(
                      (sum, item) => sum + item.resolved,
                      0,
                    ) || 0}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800">Resolved</h3>
                <p className="text-xs text-slate-500 mt-1">Successfully closed</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    {complaintTrends.length
                      ? `${Math.round(
                          (complaintTrends.reduce(
                            (sum, item) => sum + item.resolved,
                            0,
                          ) /
                            complaintTrends.reduce(
                              (sum, item) => sum + item.total,
                              0,
                            )) *
                            100,
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800">Response Rate</h3>
                <p className="text-xs text-slate-500 mt-1">Resolution efficiency</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Complaint Trends Chart */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Complaint Trends</h3>
                  <p className="text-xs text-slate-500 mt-1">Your complaints over the last 6 months</p>
                </div>
                <div className="h-64">
                  {complaintTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart
                        data={complaintTrends}
                        margin={{
                          top: 10,
                          right: 12,
                          left: 0,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          fontSize={11}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, "auto"]}
                          fontSize={11}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="resolved"
                          fill="#10b981"
                          radius={4}
                          name="Resolved"
                        />
                        <Bar
                          dataKey="in_progress"
                          fill="#3b82f6"
                          radius={4}
                          name="In Progress"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <p className="text-slate-500 text-xs">No complaint data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
                  <p className="text-xs text-slate-500 mt-1">Essential tasks and features</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurrentPage("rent")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-3 rounded-lg text-xs font-medium shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Rent
                  </button>
                  <button
                    onClick={() => setCurrentPage("complaints")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-lg text-xs font-medium shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    File Complaint
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Bill Management</h3>
                  <p className="text-xs text-slate-500 mt-1">View and pay your utility bills</p>
                </div>
                <button
                  onClick={() => setCurrentPage("bills")}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all"
                >
                  Manage Bills
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      title="HamroSamaj"
      sidebarItems={sidebarItems()}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleLogout={handleLogout}
      renderContent={renderContent}
    />
  );
};

export default ResidentDashboard;
