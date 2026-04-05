import React, { useState, useEffect } from 'react';
import { useResidentDashboardStore } from '../../store/residentDashboardStore';
import { DashboardLayout } from '../UI/dashboardlayout';
import ProfilePage from '../Profiles/profile';
import RentPayment from '../Payments/rentPayment';
import UserComplaints from '../Complaints/userComplaints';
import CommunityHub from '../Community/communityHub';
import VisitorSection from '../Management/visitorManagement';
import ChatSection from '../chat/chatSection';
import ChartCard from '../UI/chartCard';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosConfig';

const ResidentDashboard = () => {
    const { currentPage, setCurrentPage, handleLogout } = useResidentDashboardStore();
    const [complaintTrends, setComplaintTrends] = useState([]);
    const [activeComplaints, setActiveComplaints] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to view data');
                    return;
                }
                const config = { headers: { Authorization: `Token ${token}` } };

                const [complaintTrendsRes, complaintsRes] = await Promise.all([
                    api.get('/api/v1/complaints/resident-trends/', config).catch(err => ({
                        error: err.response?.data?.detail || 'Failed to fetch complaint trends'
                    })),
                    api.get('/api/v1/complaints/list', config).catch(err => ({
                        error: err.response?.data?.detail || 'Failed to fetch complaints'
                    }))
                ]);

                if (complaintTrendsRes.error) {
                    console.error('Complaint trends error:', complaintTrendsRes.error);
                    setComplaintTrends([]);
                } else {
                    setComplaintTrends(complaintTrendsRes.data);
                }

                if (complaintsRes.error) {
                    console.error('Complaints error:', complaintsRes.error);
                    setActiveComplaints(0);
                } else {
                    setActiveComplaints(complaintsRes.data.filter(c => c.status === 'in_progress').length);
                }

                if (complaintTrendsRes.error && complaintsRes.error) {
                    setError('Failed to load dashboard data. Please try again later.');
                } else {
                    setError(null);
                }
            } catch (err) {
                console.error('Unexpected error fetching dashboard data:', err);
                setError('An unexpected error occurred. Please try again later.');
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
                            {`${entry.name === 'in_progress' ? 'In Progress' : entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const sidebarItems = () => [
        { label: 'Dashboard', page: 'dashboard' },
        { label: 'Rent Payment', page: 'rent' },
        { label: 'Visitors', page: 'visitors' },
        { label: 'Complaints', page: 'complaints' },
        { label: 'Community', page: 'community-hub' },
        { label: 'Messages', page: 'chat' },
    ];

    const renderContent = () => {
        switch (currentPage) {
            case 'profile':
                return <ProfilePage />;
            case 'rent':
                return <RentPayment />;
            case 'visitors':
                return <VisitorSection userRole="resident" />;
            case 'complaints':
                return <UserComplaints />;
            case 'community-hub':
                return <CommunityHub />;
            case 'chat':
                return <ChatSection />;
            default:
                return (
                    <div className="p-8 bg-[#F5F8F6]">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-[#2C3B2A]">Resident Dashboard</h2>
                                <p className="text-sm text-[#5C7361] mt-1">Welcome to your personal dashboard</p>
                            </div>

                            {error ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                                    {error}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                        {/* Complaint Trends Chart */}
                                        <div className="md:col-span-3 lg:col-span-3">
                                            <ChartCard
                                                title="Complaint Trends"
                                                description="Your complaints over the last 6 months"
                                                footer="Showing complaints by status"
                                                className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6 pb-12"
                                            >
                                                <div className="h-[400px]">
                                                    {complaintTrends.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height={400}>
                                                            <BarChart
                                                                data={complaintTrends}
                                                                margin={{ top: 10, right: 12, left: 0, bottom: 80 }}
                                                            >
                                                                <CartesianGrid vertical={false} stroke="#E8EFEA" />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    tickLine={false}
                                                                    axisLine={false}
                                                                    tickMargin={10}
                                                                    fontSize={12}
                                                                />
                                                                <YAxis
                                                                    tickLine={false}
                                                                    axisLine={false}
                                                                    tickMargin={8}
                                                                    domain={[0, 'auto']}
                                                                    fontSize={12}
                                                                />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Bar
                                                                    dataKey="resolved"
                                                                    fill="#1A3C34"
                                                                    radius={4}
                                                                    name="Resolved"
                                                                />
                                                                <Bar
                                                                    dataKey="in_progress"
                                                                    fill="#1E3A8A"
                                                                    radius={4}
                                                                    name="In Progress"
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-[400px] flex items-center justify-center text-sm text-[#5C7361]">
                                                            No complaint data available
                                                        </div>
                                                    )}
                                                </div>
                                            </ChartCard>
                                        </div>

                                        {/* Side Elements */}
                                        <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-6">
                                            <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                                <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Active Complaints</h3>
                                                <p className="text-2xl font-bold text-[#395917] mt-1">{activeComplaints}</p>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                                <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Messages Section</h3>
                                                <p className="text-sm text-[#5C7361] mb-4">Connect with other residents.</p>
                                                <button
                                                    onClick={() => setCurrentPage('chat')}
                                                    className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors w-full text-sm"
                                                >
                                                    Go to Chat
                                                </button>
                                            </div>
                                            <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                                <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Visitors Section</h3>
                                                <p className="text-sm text-[#5C7361] mb-4">Manage your visitor registrations.</p>
                                                <button
                                                    onClick={() => setCurrentPage('visitors')}
                                                    className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors w-full text-sm"
                                                >
                                                    Manage Visitors
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                            <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Quick Actions</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setCurrentPage('rent')}
                                                    className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors text-sm"
                                                >
                                                    Pay Rent
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage('complaints')}
                                                    className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors text-sm"
                                                >
                                                    File Complaint
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-6">
                                            <h3 className="text-lg font-medium text-[#2C3B2A] mb-4">Community Updates</h3>
                                            <p className="text-sm text-[#5C7361] mb-4">Check the community hub for latest updates.</p>
                                            <button
                                                onClick={() => setCurrentPage('community-hub')}
                                                className="bg-[#395917] text-white px-4 py-2 rounded-lg hover:bg-[#2C3B2A] transition-colors w-full text-sm"
                                            >
                                                View Community Hub
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
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