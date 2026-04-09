import React, { useEffect, useState } from "react";
import { useGuardDashboardStore } from "../../store/guardDashboardStore";
import { DashboardLayout } from "../UI/dashboardlayout";
import ProfilePage from "../Profiles/profile";
import VisitorSection from "../Management/visitorManagement";
import SecurityVisitorRegister from "../Management/securityVisitorRegister";
import SecurityStripeSetup from "../Payments/securityStripeSetup";
import SecurityBillManagement from "../Management/securityBillManagement";
import ChartCard from "../UI/chartCard";
import {
  Pie,
  PieChart,
  Label,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../utils/axiosConfig";

const GuardDashboard = () => {
  const {
    currentPage,
    setCurrentPage,
    handleLogout,
    salaryInfo,
    fetchSalaryInfo,
  } = useGuardDashboardStore();

  const [visitorStats, setVisitorStats] = useState([]);
  const [visitorTrends, setVisitorTrends] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalaryInfo();
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view data");
          return;
        }
        const config = { headers: { Authorization: `Token ${token}` } };

        const [statsRes, trendsRes, recentRes] = await Promise.all([
          api.get("/api/v1/visitors/stats/", config).catch((err) => ({
            error:
              err.response?.data?.detail || "Failed to fetch visitor stats",
          })),
          api.get("/api/v1/visitors/trends/", config).catch((err) => ({
            error:
              err.response?.data?.detail || "Failed to fetch visitor trends",
          })),
          api.get("/api/v1/visitors/recent/", config).catch((err) => ({
            error:
              err.response?.data?.detail || "Failed to fetch recent visitors",
          })),
        ]);

        if (statsRes.error) {
          console.error("Visitor stats error:", statsRes.error);
          setVisitorStats([]);
        } else {
          setVisitorStats(
            statsRes.data.map((item) => ({
              status: item.status
                ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                : "Unknown",
              count: item.count || 0,
              fill:
                item.status === "checked-in"
                  ? "#90EE90"
                  : item.status === "checked-out"
                    ? "#ADD8E6"
                    : "#FECACA",
            })),
          );
        }

        if (trendsRes.error) {
          console.error("Visitor trends error:", trendsRes.error);
          setVisitorTrends([]);
        } else {
          setVisitorTrends(trendsRes.data);
        }

        if (recentRes.error) {
          console.error("Recent visitors error:", recentRes.error);
          setRecentVisitors([]);
        } else {
          setRecentVisitors(recentRes.data);
        }

        if (statsRes.error && trendsRes.error && recentRes.error) {
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
  }, [fetchSalaryInfo]);

  const LineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-[#2C3B2A] p-3 rounded-lg border border-[#E8EFEA] shadow-sm">
          <p className="font-semibold">{`Day: ${label}`}</p>
          <p>{`Visitors: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-[#2C3B2A] p-3 rounded-lg border border-[#E8EFEA] shadow-sm">
          <p className="font-semibold">{`Status: ${payload[0].name}`}</p>
          <p>{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const sidebarItems = () => [
    { label: "Dashboard", page: "dashboard" },
    { label: "Bill Management", page: "bills" },
    { label: "Manage Visitors", page: "visitors" },
    { label: "Payment Settings", page: "stripeSetup" },
  ];
  // Show only currently checked-in visitors in the center total
  const totalVisitors = visitorStats
    .filter((item) => item.status && item.status.toLowerCase() === "checked-in")
    .reduce((acc, curr) => acc + (curr.count || 0), 0);

  const renderContent = () => {
    switch (currentPage) {
      case "profile":
        return <ProfilePage />;
      case "bills":
        return <SecurityBillManagement />;
      case "visitors":
        // Unified visitor register + manage view for security
        return <SecurityVisitorRegister />;
      case "stripeSetup":
        return <SecurityStripeSetup />;
      default:
        return (
          // <div className="p-8 bg-[#F5F8F6]">
          <div className="max-w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#2C3B2A]">
                Security Dashboard
              </h2>
              <p className="text-sm text-[#5C7361] mt-1">
                Monitor and manage visitor activities
              </p>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                {error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard
                    title="Visitor Trends"
                    description="Daily visitor counts over the last 30 days"
                    footer="Showing total visitors per day"
                    className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6"
                  >
                    {visitorTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={visitorTrends}
                          margin={{
                            top: 10,
                            right: 12,
                            left: 12,
                            bottom: 10,
                          }}
                        >
                          <CartesianGrid vertical={false} stroke="#E8EFEA" />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(8, 10)}
                            fontSize={12}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            domain={[0, "auto"]}
                            fontSize={12}
                          />
                          <Tooltip content={<LineTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#395917"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-sm text-[#5C7361]">
                        No visitor trend data available
                      </div>
                    )}
                  </ChartCard>

                  <ChartCard
                    title="Visitor Status"
                    description="Current visitor status distribution"
                    footer="Showing total visitors by status"
                    className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6"
                  >
                    {visitorStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={visitorStats}
                            dataKey="count"
                            nameKey="status"
                            innerRadius={60}
                            strokeWidth={5}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (
                                  viewBox &&
                                  "cx" in viewBox &&
                                  "cy" in viewBox
                                ) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="text-3xl font-bold text-[#2C3B2A]"
                                      >
                                        {totalVisitors.toLocaleString()}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 24}
                                        className="text-sm text-[#5C7361]"
                                      >
                                        Visitors
                                      </tspan>
                                    </text>
                                  );
                                }
                              }}
                            />
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-sm text-[#5C7361]">
                        No visitor data available
                      </div>
                    )}
                  </ChartCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                    <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">
                      Current Salary
                    </h3>
                    <p className="text-2xl font-bold text-[#395917]">
                      {salaryInfo
                        ? `₹${salaryInfo.current_salary}`
                        : "Loading..."}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6 md:col-span-2">
                    <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">
                      Recent Visitors
                    </h3>
                    {recentVisitors.length > 0 ? (
                      <ul className="space-y-2">
                        {recentVisitors.map((visitor) => (
                          <li
                            key={visitor.id}
                            className="flex justify-between text-sm text-[#5C7361]"
                          >
                            <span>{visitor.name}</span>
                            <span>
                              {visitor.status} - {visitor.created_at}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#5C7361]">
                        No recent visitors
                      </p>
                    )}
                  </div>
                </div>

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                    <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setCurrentPage("visitors")}
                        className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors text-sm"
                      >
                        Manage Visitors
                      </button>
                      <button
                        onClick={() => setCurrentPage("stripeSetup")}
                        className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors text-sm"
                      >
                        View Payments
                      </button>
                    </div>
                  </div>
                </div> */}
              </>
            )}
          </div>
          // </div>
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

export default GuardDashboard;
