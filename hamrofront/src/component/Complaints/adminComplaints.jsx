import React, { useEffect, useState } from 'react';
import { useAdminComplaintsStore } from '../../store/adminComplaintsStore';
import { AlertCircle, X } from 'lucide-react';

export default function AdminComplaints() {
    const {
        residentComplaints,
        adminComplaints,
        newComplaint,
        loading,
        error,
        userRole,
        residentResponses,
        residentStatuses,
        responseError,
        setNewComplaint,
        setResidentResponse,
        setResidentStatus,
        fetchComplaints,
        fetchUserRole,
        handleSubmit,
        handleResidentRespond
    } = useAdminComplaintsStore();

    const [sentimentData, setSentimentData] = useState(null);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [activeTab, setActiveTab] = useState('resident');

    useEffect(() => {
        fetchComplaints();
        fetchUserRole();
        fetchSentimentAnalysis();
    }, [fetchComplaints, fetchUserRole]);

    const fetchSentimentAnalysis = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/v1/complaints/sentiment/', {
            headers: { Authorization: `Token ${token}` }
        });
        const data = await response.json();
        setSentimentData(data);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-[#2C3B2A] bg-[#F5F8F6]">
            <span className="animate-pulse">Loading...</span>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center min-h-screen text-red-700 bg-[#F5F8F6]">
            {error}
        </div>
    );

    const getSentimentTag = (sentiment) => {
        if (sentiment === 'Positive') return { label: 'Positive', color: 'bg-[#E8EFEA] text-[#395917]' };
        if (sentiment === 'Negative') return { label: 'Negative', color: 'bg-red-100 text-red-800' };
        return { label: 'Neutral', color: 'bg-[#F5F8F6] text-[#5C7361]' };
    };

    const handleFormSubmit = async (e) => {
        await handleSubmit(e);
        if (!error) setShowComplaintForm(false);
    };

    const renderComplaintList = (complaints, type) => (
        complaints.length === 0 ? (
            <div className="p-8 text-center text-[#5C7361]">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-70" />
                <p className="text-lg">No {type} complaints found</p>
            </div>
        ) : (
            <div className="divide-y divide-[#E8EFEA]">
                {complaints.map((complaint) => {
                    const isResidentComplaint = type === 'resident';
                    const customSentiment = getSentimentTag(complaint.custom_sentiment);
                    const currentResponse = isResidentComplaint ? residentResponses[complaint.id] || '' : '';
                    const currentStatus = isResidentComplaint ? residentStatuses[complaint.id] || 'in_progress' : complaint.status;
                    const isResolvedWithoutResponse = isResidentComplaint && currentStatus === 'resolved' && !currentResponse.trim();

                    return (
                        <div key={complaint.id} className="p-6 hover:bg-[#F5F8F6] transition-all duration-150">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-[#2C3B2A]">{complaint.subject}</h4>
                                    <p className="text-sm text-[#5C7361] mt-1">
                                        {isResidentComplaint ? `Room ${complaint.room_number}` : `User: ${complaint.username} - ${complaint.apartment_name}`}
                                    </p>
                                    <p className="text-[#2C3B2A] mt-2 leading-relaxed">{complaint.description}</p>
                                    {complaint.response && (
                                        <p className="mt-3 text-sm text-[#5C7361] italic">
                                            <span className="font-medium">Response:</span> {complaint.response}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${customSentiment.color}`}>
                                    Sentiment: {customSentiment.label}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    complaint.status === 'resolved' ? 'bg-[#E8EFEA] text-[#395917]' : 'bg-[#F5F8F6] text-[#5C7361]'
                                }`}>
                                    {complaint.status.replace('_', ' ')}
                                </span>
                            </div>
                            </div>
                            {isResidentComplaint && complaint.status !== 'resolved' && userRole === 'admin' && (
                                <div className="mt-6 space-y-4">
                                    <textarea
                                        placeholder="Your response..."
                                        value={currentResponse}
                                        onChange={(e) => setResidentResponse(complaint.id, e.target.value)}
                                        className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-3 rounded-lg focus:outline-none focus:border-[#5C7361] transition-all duration-200 resize-none h-24 shadow-sm"
                                    />
                                    {responseError && isResolvedWithoutResponse && (
                                        <p className="text-red-700 text-sm font-medium">{responseError}</p>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={currentStatus}
                                            onChange={(e) => setResidentStatus(complaint.id, e.target.value)}
                                            className="bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-2 rounded-lg focus:outline-none focus:border-[#5C7361] transition-all duration-200 shadow-sm"
                                        >
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                        <button
                                            onClick={() => handleResidentRespond(complaint.id)}
                                            disabled={isResolvedWithoutResponse}
                                            className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 ${
                                                isResolvedWithoutResponse
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-[#395917] hover:bg-[#2C3B2A] text-white'
                                            }`}
                                        >
                                            Respond
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )
    );


    return (
        <div className="p-8 bg-[#F5F8F6] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-medium text-[#2C3B2A]">Complaints Management</h2>
                        <p className="text-md text-[#5C7361] mt-2">Handle resident complaints and submit issues to superadmin</p>
                    </div>
                    <button
                        onClick={() => setShowComplaintForm(true)}
                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200"
                    >
                        New Complaint
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('resident')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                            activeTab === 'resident' ? 'bg-[#395917] text-white' : 'bg-[#E8EFEA] text-[#2C3B2A] hover:bg-[#D8E3DC]'
                        }`}
                    >
                        Resident Complaints
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                            activeTab === 'history' ? 'bg-[#395917] text-white' : 'bg-[#E8EFEA] text-[#2C3B2A] hover:bg-[#D8E3DC]'
                        }`}
                    >
                        My Complaint History
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-[#E8EFEA] overflow-hidden">
                    <div className="p-6 bg-[#F5F8F6] border-b border-[#E8EFEA]">
                        <h3 className="text-xl font-semibold text-[#2C3B2A]">
                            {activeTab === 'resident' ? 'Resident Complaints' : 'My Complaint History'}
                        </h3>
                    </div>
                    {activeTab === 'resident' ? renderComplaintList(residentComplaints, 'resident') : renderComplaintList(adminComplaints, 'admin')}
                </div>

                {userRole === 'admin' && activeTab === 'resident' }

                {showComplaintForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8 transform transition-all duration-300 scale-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-[#2C3B2A]">Submit a New Complaint</h3>
                                <button
                                    onClick={() => setShowComplaintForm(false)}
                                    className="p-2 hover:bg-[#E8EFEA] rounded-full transition-all duration-200"
                                >
                                    <X className="h-6 w-6 text-[#2C3B2A]" />
                                </button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#2C3B2A] mb-2">Subject</label>
                                    <input
                                        type="text"
                                        value={newComplaint.subject || ''}
                                        onChange={(e) => setNewComplaint({ subject: e.target.value })}
                                        placeholder="Enter subject"
                                        className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-3 rounded-lg focus:outline-none focus:border-[#5C7361] transition-all duration-200 shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#2C3B2A] mb-2">Description</label>
                                    <textarea
                                        value={newComplaint.description || ''}
                                        onChange={(e) => setNewComplaint({ description: e.target.value })}
                                        placeholder="Describe your issue"
                                        className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-3 rounded-lg focus:outline-none focus:border-[#5C7361] transition-all duration-200 h-32 resize-none shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowComplaintForm(false)}
                                        className="px-6 py-2 rounded-lg text-[#2C3B2A] hover:bg-[#E8EFEA] font-semibold transition-all duration-200 shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-200"
                                    >
                                        Submit Complaint
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}