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
        <div className="p-8 bg-[#F5F8F6] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#2C3B2A]">Resident Complaints</h2>
                        <p className="text-[#5C7361] mt-1">Submit and track your complaints</p>
                    </div>
                    <button
                        onClick={() => setShowComplaintForm(true)}
                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        New Complaint
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
                    <div className="p-6 border-b border-[#E8EFEA]">
                        <h3 className="text-lg font-medium text-[#2C3B2A]">My Complaints</h3>
                    </div>
                    {complaints.length === 0 ? (
                        <div className="p-8 text-center text-[#5C7361]">
                            <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-70" />
                            <p>No complaints found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E8EFEA]">
                            {complaints.map((complaint) => {
                                const customSentiment = getSentimentTag(complaint.custom_sentiment);
                                return (
                                    <div key={complaint.id} className="p-6 hover:bg-[#F5F8F6] transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium text-[#2C3B2A]">{complaint.subject}</h4>
                                                <p className="text-sm text-[#5C7361] mt-1">Room {complaint.room_number}</p>
                                                <p className="text-[#2C3B2A] mt-2">{complaint.description}</p>
                                                {complaint.response && (
                                                    <p className="mt-2 text-sm text-[#5C7361]">
                                                        <span className="font-medium">Admin Response:</span> {complaint.response}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${customSentiment.color}`}>
                                                    Sentiment: {customSentiment.label}
                                                </span>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                                    complaint.status === 'resolved' ? 'bg-[#E8EFEA] text-[#395917]' :
                                                    complaint.status === 'in_progress' ? 'bg-[#F5F8F6] text-[#5C7361]' :
                                                    'bg-gray-100 text-gray-800'
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

                {showComplaintForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full mx-4 p-8 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-[#2C3B2A]">Submit a New Complaint</h3>
                                <button
                                    onClick={() => setShowComplaintForm(false)}
                                    className="p-2 hover:bg-[#E8EFEA] rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-[#2C3B2A]" />
                                </button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C3B2A] mb-1">Room Number</label>
                                        <input
                                            type="text"
                                            value={newComplaint.room_number || ''}
                                            onChange={(e) => setNewComplaint({ room_number: e.target.value })}
                                            placeholder="Enter room number"
                                            className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-2 rounded-lg focus:outline-none focus:border-[#5C7361] transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2C3B2A] mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={newComplaint.subject || ''}
                                            onChange={(e) => setNewComplaint({ subject: e.target.value })}
                                            placeholder="Enter subject"
                                            className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-2 rounded-lg focus:outline-none focus:border-[#5C7361] transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#2C3B2A] mb-1">Description</label>
                                    <textarea
                                        value={newComplaint.description || ''}
                                        onChange={(e) => setNewComplaint({ description: e.target.value })}
                                        placeholder="Describe your issue"
                                        className="w-full bg-[#F5F8F6] border border-[#E8EFEA] text-[#2C3B2A] px-4 py-2 rounded-lg focus:outline-none focus:border-[#5C7361] transition-colors h-24 resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowComplaintForm(false)}
                                        className="px-6 py-2 rounded-lg text-[#2C3B2A] hover:bg-[#E8EFEA] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2 rounded-lg font-medium transition-colors"
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

export default UserComplaints;