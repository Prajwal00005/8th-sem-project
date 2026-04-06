import React, { useEffect, useState } from "react";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { DashboardLayout } from "../UI/dashboardlayout";
import ProfilePage from "../Profiles/profile";
import UserManagement from "../Management/userManagement";
import AdminComplaints from "../Complaints/adminComplaints";
import AdminStripeSetup from "../Payments/adminSetup";
import ChartCard from "../UI/chartCard";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../utils/axiosConfig";
import AdminSubscriptionPayment from "../Payments/adminSubscriptionPayment"; //New field
import AdminSecurityPayment from "../Payments/adminSecurityPayment";
import AdminReports from "./adminReports";

const AdminDashboard = () => {
  const {
    currentPage,
    setCurrentPage,
    fetchProfile,
    handleLogout,
    sidebarItems,
  } = useAdminDashboardStore();

  const [sentimentTrends, setSentimentTrends] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("useEffect triggered for AdminDashboard");
    fetchProfile();
    const intervalId = setInterval(fetchProfile, 5000);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view data");
          return;
        }
        const config = { headers: { Authorization: `Token ${token}` } };

        const [sentimentRes, complaintRes] = await Promise.all([
          api.get("/api/v1/sentiment/trends/", config),
          api.get("/api/v1/complaints/trends/", config),
        ]);

        console.log("Sentiment Trends Response:", sentimentRes.data);
        console.log("Complaint Trends Response:", complaintRes.data);

        setSentimentTrends(sentimentRes.data);
        setComplaintTrends(complaintRes.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      }
    };
    fetchData();

    return () => clearInterval(intervalId);
  }, [fetchProfile]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#fbfbfb00] text-[#000] p-3 rounded-lg border border-[#E8EFEA]">
          <p className="font-semibold">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name === "in_progress" ? "InProgress" : entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "userManagement":
        return <UserManagement />;
      case "stripeSetup":
        return <AdminStripeSetup />;
      case "subscriptionPayment":
        return <AdminSubscriptionPayment />;
      case "securityPayment":
        return <AdminSecurityPayment />;
      case "complaints":
        return <AdminComplaints />;
      case "reports":
        return <AdminReports />;
      default:
        return (
          <div className="space-y-4 p-4">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Monitor resident feedback and trends
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
                    {complaintTrends.reduce(
                      (sum, item) => sum + item.total,
                      0,
                    ) || 0}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800">Total Complaints</h3>
                <p className="text-xs text-slate-500 mt-1">All time records</p>
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

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title="Sentiment Trends"
                  description="Resident complaint sentiments over the last 6 months"
                  footer="Showing sentiment distribution"
                >
                  {sentimentTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={sentimentTrends}
                        margin={{ top: 10, right: 12, left: 12, bottom: 10 }}
                      >
                        <CartesianGrid vertical={false} stroke="#E8EFEA" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fbfbfb00",
                            color: "#000",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          dataKey="positive"
                          type="natural"
                          fill="#90EE90"
                          fillOpacity={0.4}
                          stroke="#2F4F4F"
                          stackId="a"
                        />
                        <Area
                          dataKey="negative"
                          type="natural"
                          fill="#FECACA"
                          fillOpacity={0.4}
                          stroke="#B91C1C"
                          stackId="a"
                        />
                        <Area
                          dataKey="neutral"
                          type="natural"
                          fill="#ADD8E6"
                          fillOpacity={0.4}
                          stroke="#00008B"
                          stackId="a"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-[#5C7361]">
                      No sentiment data available
                    </div>
                  )}
                </ChartCard>

                <ChartCard
                  title="Complaint Trends"
                  description="Complaint status over the last 6 months"
                  footer="Showing total complaints by status"
                >
                  {complaintTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={complaintTrends}
                        margin={{ top: 10, right: 12, left: 12, bottom: 10 }}
                      >
                        <CartesianGrid vertical={false} stroke="#E8EFEA" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, "auto"]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="resolved"
                          fill="#2F4F4F"
                          radius={4}
                          name="Resolved"
                        />
                        <Bar
                          dataKey="in_progress"
                          fill="#D97706"
                          radius={4}
                          name="InProgress"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-[#5C7361]">
                      No complaint data available
                    </div>
                  )}
                </ChartCard>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setCurrentPage("complaints")}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Complaints
                </button>
                <button
                  onClick={() => setCurrentPage("userManagement")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users
                </button>
                <button
                  onClick={() => setCurrentPage("reports")}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Reports
                </button>
                <button
                  onClick={() => setCurrentPage("stripeSetup")}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payments
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

export default AdminDashboard;
