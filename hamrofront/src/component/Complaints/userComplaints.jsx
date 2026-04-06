import React, { useEffect, useState } from 'react';
import { useUserComplaintsStore } from '../../store/userComplaintsStore';
import { AlertCircle, X } from 'lucide-react';

function UserComplaints() {
    const {
        complaints,
        newComplaint,
        loading,
        error,
        setNewComplaint,
        fetchComplaints,
        handleSubmit
    } = useUserComplaintsStore();

    const [showComplaintForm, setShowComplaintForm] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-[#2C3B2A] bg-[#F5F8F6]">
            Loading...
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

    return (
        <div className="space-y-4 p-4">
            {/* Header Section */}
            <div className="text-center lg:text-left">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Resident Complaints
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Submit and track your complaints
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
                            {complaints.length}
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
                            {complaints.filter(c => c.status === 'resolved').length}
                        </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800">Resolved</h3>
                    <p className="text-xs text-slate-500 mt-1">Successfully closed</p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-800">
                            {complaints.filter(c => c.status === 'in_progress').length}
                        </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800">In Progress</h3>
                    <p className="text-xs text-slate-500 mt-1">Currently being addressed</p>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-start">
                <button
                    onClick={() => setShowComplaintForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all"
                >
                    New Complaint
                </button>
            </div>

            {/* Complaints List */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
                    <h3 className="text-lg font-semibold text-slate-800">My Complaints</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                {complaints.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm">No complaints found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {complaints.map((complaint) => {
                            const customSentiment = getSentimentTag(complaint.custom_sentiment);
                            return (
                                <div key={complaint.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h4 className="text-base font-medium text-slate-800">{complaint.subject}</h4>
                                            <p className="text-sm text-slate-600 mt-1">Room {complaint.room_number}</p>
                                            <p className="text-slate-700 mt-2">{complaint.description}</p>
                                            {complaint.response && (
                                                <p className="mt-2 text-sm text-slate-600">
                                                    <span className="font-medium">Admin Response:</span> {complaint.response}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${customSentiment.color}`}>
                                                Sentiment: {customSentiment.label}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                                complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                complaint.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {complaint.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Complaint Form Modal */}
            {showComplaintForm && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg max-w-3xl w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800">Submit a New Complaint</h3>
                                <p className="text-sm text-slate-500 mt-1">Fill in the complaint details</p>
                            </div>
                            <button
                                onClick={() => setShowComplaintForm(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-800 mb-1">Room Number</label>
                                    <input
                                        type="text"
                                        value={newComplaint.room_number || ''}
                                        onChange={(e) => setNewComplaint({ room_number: e.target.value })}
                                        placeholder="Enter room number"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-800 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={newComplaint.subject || ''}
                                        onChange={(e) => setNewComplaint({ subject: e.target.value })}
                                        placeholder="Enter subject"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-800 mb-1">Description</label>
                                <textarea
                                    value={newComplaint.description || ''}
                                    onChange={(e) => setNewComplaint({ description: e.target.value })}
                                    placeholder="Describe your issue"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors h-24 resize-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowComplaintForm(false)}
                                    className="px-6 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all"
                                >
                                    Submit Complaint
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserComplaints;