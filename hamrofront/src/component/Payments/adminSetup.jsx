import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStripeSetupStore } from "../../store/adminStripeSetupStore";
import { Alert, AlertDescription } from "../UI/alert";
import { useSearchParams } from "react-router-dom";

const AdminStripeSetup = () => {
  const {
    loading,
    error,
    isConnected,
    searchTerm,
    setSearchTerm,
    checkStripeStatus,
    handleStripeConnect,
    getFilteredHistory,
  } = useAdminStripeSetupStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const setupComplete = searchParams.get("setup_complete") === "true";
    const returnToDashboard =
      localStorage.getItem("returnToDashboard") === "true";

    if (setupComplete || returnToDashboard) {
      checkStripeStatus().then(() => {
        if (useAdminStripeSetupStore.getState().isConnected) {
          const role = localStorage.getItem("role");
          if (role === "admin") {
            navigate("/admin-dashboard");
          } else {
            console.error("Invalid role for AdminStripeSetup:", role);
            navigate("/login");
          }
          localStorage.removeItem("returnToDashboard");
        }
      });
    } else {
      checkStripeStatus();
    }
  }, [checkStripeStatus, navigate]);

  const downloadPDF = async () => {
    try {
      const filteredIds = filteredHistory.map((payment) => payment.id);
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/generatePaymentHistoryPDF/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payment_ids: filteredIds }),
        },
      );
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "payment_history.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      useAdminStripeSetupStore
        .getState()
        .setError("Failed to download PDF. Please try again.");
    }
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="space-y-6">
      {error && (
        <Alert
          variant="error"
          className="mb-4 bg-red-50 text-red-900 rounded-xl"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Payment Settings
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage your payment gateway and view transaction history
        </p>
      </div>

      {/* Payment Gateway Status */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
        {isConnected ? (
          <div>
            <div className="p-3 border-b border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Payment Gateway Status
                  </h3>
                  <p className="text-xs text-slate-600">
                    Active and ready to process payments
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Connected and operational</span>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-slate-50/80 p-3 rounded-lg mb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Transaction Search</h4>
                <div className="flex flex-col lg:flex-row gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by resident name or room number..."
                      className="w-full px-3 py-2 pl-8 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={downloadPDF}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Resident</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500 text-sm">
                        No payment history available.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2">
                          <div className="text-slate-600 text-sm">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800 text-sm">{payment.resident_name}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-slate-600 text-sm">{payment.room_number || '—'}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-semibold text-slate-800 text-sm">
                            ₹{Number(payment.amount).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Connect Payment Gateway
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
              Set up your payment gateway to start accepting payments from residents securely.
            </p>
            <button
              onClick={handleStripeConnect}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 00-5.656 0l4 4a4 4 0 005.656 0l4-4a4 4 0 00.536-5.656L10 9.586V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-5.586a1 1 0 01-.707-.293l-5.414-5.414A1 1 0 016 8.586V7a2 2 0 00-2-2z" />
                  </svg>
                  <span>Connect Payment Gateway</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStripeSetup;
