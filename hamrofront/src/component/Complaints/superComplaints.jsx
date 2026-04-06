import React, { useEffect, useState } from "react";
import { useSAComplaintsStore } from "../../store/superComplaintsStore";
import { AlertCircle, X } from "lucide-react";

export default function SAComplaints() {
  const {
    complaints,
    newComplaint,
    loading,
    error,
    userRole,
    responses,
    selectedStatuses,
    responseError,
    setNewComplaint,
    setResponse,
    setSelectedStatus,
    fetchComplaints,
    fetchUserRole,
    handleSubmit,
    handleRespond,
  } = useSAComplaintsStore();

  const [sentimentData, setSentimentData] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchUserRole();
    fetchSentimentAnalysis();
  }, [fetchComplaints, fetchUserRole]);

  const fetchSentimentAnalysis = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/complaints/sentiment/",
      {
        headers: { Authorization: `Token ${token}` },
      },
    );
    const data = await response.json();
    setSentimentData(data);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-[#2C3B2A] bg-gray-50">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-700 bg-gray-50">
        {error}
      </div>
    );

  const getSentimentTag = (sentiment) => {
    if (sentiment === "Positive")
      return { label: "Positive", color: "bg-[#E8EFEA] text-[#395917]" };
    if (sentiment === "Negative")
      return { label: "Negative", color: "bg-red-100 text-red-800" };
    return { label: "Neutral", color: "bg-[#F5F8F6] text-[#5C7361]" };
  };

  const handleFormSubmit = async (e) => {
    await handleSubmit(e);
    if (!error) setShowComplaintForm(false);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {userRole === "admin" ? "Admin Complaints" : "Complaints Management"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {userRole === "admin" ? "Submit issues to superadmin" : "Review and respond to admin complaints"}
          </p>
        </div>
        {userRole === "admin" && (
          <button
            onClick={() => setShowComplaintForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            New Complaint
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-3">
          <h3 className="text-base font-semibold text-slate-800">
            {userRole === "admin" ? "Admin Complaints" : "Complaints Management"}
          </h3>
        </div>

        {/* Complaints */}
        <div className="p-3">
          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 002 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => {
                const textblobSentiment = getSentimentTag(complaint.sentiment);
                const customSentiment = getSentimentTag(complaint.custom_sentiment);
                const currentStatus = selectedStatuses[complaint.id] || "in_progress";
                const currentResponse = responses[complaint.id] || "";
                const isResolvedWithoutResponse = currentStatus === "resolved" && !currentResponse.trim();

                return (
                  <div
                    key={complaint.id}
                    className="bg-white/50 rounded-lg p-3 border border-slate-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-slate-800">{complaint.subject}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          User: {complaint.username} - {complaint.apartment_name}
                        </p>
                        <p className="text-slate-700 mt-2 leading-relaxed text-sm">{complaint.description}</p>
                        {complaint.response && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-800 mb-1">
                              {userRole === "admin" ? "Superadmin Response:" : "Response:"}
                            </p>
                            <p className="text-slate-700 text-sm">{complaint.response}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${customSentiment.color}`}>
                          {customSentiment.label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            complaint.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : complaint.status === "in_progress"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    
                    {userRole === "superadmin" && complaint.status !== "resolved" && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          placeholder="Your response..."
                          value={currentResponse}
                          onChange={(e) => setResponse(complaint.id, e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16 text-sm"
                        />
                        {responseError && isResolvedWithoutResponse && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <p className="text-red-700 text-xs font-medium">{responseError}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <select
                            value={currentStatus}
                            onChange={(e) => setSelectedStatus(complaint.id, e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                          >
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <button
                            onClick={() => handleRespond(complaint.id)}
                            disabled={isResolvedWithoutResponse}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 text-sm ${
                              isResolvedWithoutResponse
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
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
          )}
        </div>
      </div>

      {/* New Complaint Form Modal */}
      {userRole === "admin" && showComplaintForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Submit a New Complaint</h3>
              <button
                onClick={() => setShowComplaintForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newComplaint.subject || ""}
                  onChange={(e) => setNewComplaint({ subject: e.target.value })}
                  placeholder="Enter subject"
                  className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newComplaint.description || ""}
                  onChange={(e) => setNewComplaint({ description: e.target.value })}
                  placeholder="Describe your issue"
                  className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-32"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowComplaintForm(false)}
                  className="px-6 py-3 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300"
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
