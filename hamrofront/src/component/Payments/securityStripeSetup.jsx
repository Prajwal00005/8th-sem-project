import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecurityStripeSetupStore } from "../../store/securityStripeSetupStore";
import { useSearchParams } from "react-router-dom";
import PaymentHistoryPDF from "./paymentHistoryPdf";

const SecurityStripeSetup = () => {
  const {
    loading,
    error,
    isConnected,
    searchTerm,
    setSearchTerm,
    checkStripeStatus,
    handleStripeConnect,
    getFilteredHistory,
  } = useSecurityStripeSetupStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const setupComplete = searchParams.get("setup_complete") === "true";
    const returnToDashboard =
      localStorage.getItem("returnToDashboard") === "true";

    if (setupComplete || returnToDashboard) {
      checkStripeStatus().then(() => {
        if (useSecurityStripeSetupStore.getState().isConnected) {
          const role = localStorage.getItem("role");
          if (role === "security") {
            navigate("/security-dashboard");
          } else {
            console.error("Invalid role for SecurityStripeSetup:", role);
            navigate("/login");
          }
          localStorage.removeItem("returnToDashboard");
        }
      });
    } else {
      checkStripeStatus();
    }
  }, [checkStripeStatus, navigate]);

  const columns = [
    { label: "Admin", key: "admin_username" },
    {
      label: "Month/Year",
      key: "payment_period",
      render: (row) =>
        row.payment_month && row.payment_year
          ? `${String(row.payment_month).padStart(2, "0")}/${row.payment_year}`
          : row.payment_year || "-",
    },
    {
      label: "Payment Date",
      key: "created_at",
      render: (row) => {
        if (!row.created_at) return "-";
        const dt = new Date(row.created_at);
        if (Number.isNaN(dt.getTime())) return "-";
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const day = String(dt.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      },
    },
    { label: "Amount", key: "amount", render: (row) => `₹${row.amount}` },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            row.status === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const filteredHistory = getFilteredHistory();

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Payment Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your payment gateway and view salary payments
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Payment Gateway Active
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Ready to receive salary payments from admins
                  </p>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by admin username or payment year..."
                  className="w-full py-3 px-5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                />
                {/* <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-3 h-3 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div> */}
              </div>
              <PaymentHistoryPDF
                title="Security Payment History"
                data={filteredHistory}
                columns={columns}
                filename="security_payment_history"
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 rounded-lg text-sm transition-all duration-300"
              />
            </div>

            {/* Payment History */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500"></div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">
                    No payment history available.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                          Admin
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                          Month/Year
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                          Payment Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredHistory.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-2 text-xs text-slate-800 font-medium">
                            {payment.admin_username}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600">
                            {payment.payment_month && payment.payment_year
                              ? `${String(payment.payment_month).padStart(2, "0")}/${payment.payment_year}`
                              : payment.payment_year || "-"}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600">
                            {(() => {
                              if (!payment.created_at) return "-";
                              const dt = new Date(payment.created_at);
                              if (Number.isNaN(dt.getTime())) return "-";
                              const year = dt.getFullYear();
                              const month = String(dt.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const day = String(dt.getDate()).padStart(2, "0");
                              return `${year}/${month}/${day}`;
                            })()}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-800">
                            ₹{payment.amount}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                                payment.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              Connect Payment Gateway
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
              Set up your payment gateway to start receiving salary payments
              securely.
            </p>
            <button
              onClick={handleStripeConnect}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Connecting...</span>
                </>
              ) : (
                <span className="text-sm">Connect Payment Gateway</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityStripeSetup;
