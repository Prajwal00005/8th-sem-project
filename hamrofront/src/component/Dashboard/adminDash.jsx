import React, { useEffect, useState } from 'react';
import { useAdminDashboardStore } from '../../store/adminDashboardStore';
import { DashboardLayout } from '../UI/dashboardlayout';
import ProfilePage from '../Profiles/profile';
import UserManagement from '../Management/userManagement';
import AdminComplaints from '../Complaints/adminComplaints';
import AdminStripeSetup from '../Payments/adminSetup';
import ChartCard from '../UI/chartCard';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosConfig';
import AdminSubscriptionPayment from '../Payments/adminSubscriptionPayment'; //New field
import AdminSecurityPayment from '../Payments/adminSecurityPayment';

const AdminDashboard = () => {
    const {
        currentPage,
        setCurrentPage,
        fetchProfile,
        handleLogout,
        sidebarItems
    } = useAdminDashboardStore();

    const [sentimentTrends, setSentimentTrends] = useState([]);
    const [complaintTrends, setComplaintTrends] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('useEffect triggered for AdminDashboard');
        fetchProfile();
        const intervalId = setInterval(fetchProfile, 5000);

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to view data');
                    return;
                }
                const config = { headers: { Authorization: `Token ${token}` } };

                const [sentimentRes, complaintRes] = await Promise.all([
                    api.get('/api/v1/sentiment/trends/', config),
                    api.get('/api/v1/complaints/trends/', config)
                ]);

                console.log('Sentiment Trends Response:', sentimentRes.data);
                console.log('Complaint Trends Response:', complaintRes.data);

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
                            {`${entry.name === 'in_progress' ? 'InProgress' : entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'profile':
                return <ProfilePage />;
            case 'userManagement':
                return <UserManagement />;
            case 'stripeSetup':
                return <AdminStripeSetup />;
            case 'subscriptionPayment':
                return <AdminSubscriptionPayment />;
            case 'securityPayment':
                return <AdminSecurityPayment />; 
            case 'complaints':
                return <AdminComplaints />;
            default:
                return (
                    <div className="p-8 bg-[#F5F8F6]">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-[#2C3B2A]">Dashboard Overview</h2>
                                <p className="text-[#5C7361] mt-1">Monitor resident feedback and trends</p>
                            </div>

                            {error ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                                    {error}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                        domain={[0, 'auto']}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#fbfbfb00',
                                                            color: '#000',
                                                            borderRadius: '8px'
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
                                                        domain={[0, 'auto']}
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                    <h3 className="text-lg font-medium text-[#2C3B2A]">Total Complaints</h3>
                                    <p className="text-3xl font-bold text-[#395917] mt-2">
                                        {complaintTrends.reduce((sum, item) => sum + item.total, 0) || 0}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                    <h3 className="text-lg font-medium text-[#2C3B2A]">Resolved Complaints</h3>
                                    <p className="text-3xl font-bold text-[#395917] mt-2">
                                        {complaintTrends.reduce((sum, item) => sum + item.resolved, 0) || 0}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                    <h3 className="text-lg font-medium text-[#2C3B2A]">Response Rate</h3>
                                    <p className="text-3xl font-bold text-[#395917] mt-2">
                                        {complaintTrends.length
                                            ? `${Math.round(
                                                  (complaintTrends.reduce((sum, item) => sum + item.resolved, 0) /
                                                      complaintTrends.reduce((sum, item) => sum + item.total, 0)) * 100
                                              )}%`
                                            : '0%'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                    <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setCurrentPage('complaints')}
                                            className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors"
                                        >
                                            View Complaints
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage('userManagement')}
                                            className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors"
                                        >
                                            Manage Users
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                    <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Payments</h3>
                                    <button
                                        onClick={() => setCurrentPage('stripeSetup')}
                                        className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors w-full"
                                    >
                                        View Payment Setup
                                    </button>
                                </div>
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