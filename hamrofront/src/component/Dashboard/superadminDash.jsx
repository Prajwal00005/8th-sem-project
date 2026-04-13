import React, { useEffect, useState } from "react";
import { useSuperadminDashboardStore } from "../../store/superadminDashboardStore";
import { DashboardLayout } from "../UI/dashboardlayout";
import ProfilePage from "../Profiles/profile";
import SAComplaints from "../Complaints/superComplaints";
import SadminManagement from "../Management/adminManagement";
import ChartCard from "../UI/chartCard";
import {
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../../utils/axiosConfig";
import BlogManagement from "../InfoBlog/blogManagement";
import SuperadminStripeSetup from "../Payments/superadminStripeSetup";
import SuperadminReports from "./superadminReports";

const SuperadminDashboard = () => {
  const {
    currentPage,
    setCurrentPage,
    handleLogout,
    sidebarItems,
    fetchSubscriptionReminders,
    subscriptionReminders,
  } = useSuperadminDashboardStore();
  const [sentimentTrends, setSentimentTrends] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [error, setError] = useState(null);
  const [showReminders, setShowReminders] = useState({});

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
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

        console.log("Superadmin Sentiment Trends:", sentimentRes.data);
        console.log("Superadmin Complaint Trends:", complaintRes.data);

        setSentimentTrends(sentimentRes.data);
        setComplaintTrends(complaintRes.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      }
    };
    fetchData();
    fetchSubscriptionReminders();
  }, [fetchSubscriptionReminders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-[#000] p-3 rounded-lg border border-[#E8EFEA]">
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

  const handleCloseReminder = (adminId) => {
    setShowReminders((prev) => ({ ...prev, [adminId]: false }));
  };

  const renderContent = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "sadminManagement":
        return <SadminManagement />;
      case "stripeSetup":
        return <SuperadminStripeSetup />;
      case "SAComplaints":
        return <SAComplaints />;
      case "blogManagement":
        return <BlogManagement />;
      case "reports":
        return <SuperadminReports />;
      default:
        return (
          <div className="space-y-4 p-4">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Monitor apartment managers feedback and trends
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
                <h3 className="text-xs font-semibold text-slate-800">Total Feedback</h3>
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title="Sentiment Trends"
                description="Admin feedback sentiments over last 6 months"
                footer="Showing positive, negative and neutral trends"
              >
                {sentimentTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={sentimentTrends}
                      margin={{ top: 10, right: 12, left: 12, bottom: 10 }}
                    >
                      <CartesianGrid vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, "auto"]}
                        allowDecimals={false}
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        name="Positive"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        name="Negative"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        name="Neutral"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-xs">No sentiment data available</p>
                    </div>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Feedback Distribution"
                description="Current status of all feedback"
                footer="Showing real-time feedback status"
              >
                {complaintTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Resolved', value: complaintTrends.reduce((sum, item) => sum + item.resolved, 0) },
                          { name: 'In Progress', value: complaintTrends.reduce((sum, item) => sum + item.in_progress, 0) },
                          { name: 'Pending', value: complaintTrends.reduce((sum, item) => sum + (item.total - item.resolved - item.in_progress), 0) }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Resolved', value: complaintTrends.reduce((sum, item) => sum + item.resolved, 0) },
                          { name: 'In Progress', value: complaintTrends.reduce((sum, item) => sum + item.in_progress, 0) },
                          { name: 'Pending', value: complaintTrends.reduce((sum, item) => sum + (item.total - item.resolved - item.in_progress), 0) }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-xs">No feedback data available</p>
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      title="HamroSamaj"
      sidebarItems={sidebarItems}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      handleLogout={handleLogout}
      renderContent={renderContent}
    />
  );
};

export default SuperadminDashboard;
