import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperadminStripeSetupStore } from "../../store/superadminStripeSetupStore";
import { Alert, AlertDescription } from "../UI/alert";
import { useSearchParams } from "react-router-dom";
import PaymentHistoryPDF from "./paymentHistoryPdf";

const SuperadminStripeSetup = () => {
  const {
    loading,
    error,
    isConnected,
    searchTerm,
    setSearchTerm,
    checkStripeStatus,
    handleStripeConnect,
    getFilteredHistory,
    extendSubscriptionBy7Days,
    toggleAdminAccess,
  } = useSuperadminStripeSetupStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const setupComplete = searchParams.get("setup_complete") === "true";
    const returnToDashboard =
      localStorage.getItem("returnToDashboard") === "true";

    if (setupComplete || returnToDashboard) {
      checkStripeStatus().then(() => {
        if (useSuperadminStripeSetupStore.getState().isConnected) {
          const role = localStorage.getItem("role");
          if (role === "superadmin") {
            navigate("/superadmin-dashboard");
          } else {
            console.error("Invalid role for SuperadminStripeSetup:", role);
            navigate("/login");
          }
          localStorage.removeItem("returnToDashboard");
        }
      });
    } else {
      checkStripeStatus();
    }
  }, [checkStripeStatus, navigate]);

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "extended":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      label: "Admin",
      key: "admin_username",
      render: (row) => row.admin_username,
    },
    { label: "Subscription Year", key: "subscription_year" },
    {
      label: "Date",
      key: "created_at",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    { label: "Amount", key: "amount", render: (row) => `₹${row.amount}` },
    {
      label: "Status",
      key: "status_display",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-sm ${getStatusClasses(row.status_display || row.status)}`}
        >
          {row.status_display || row.status}
        </span>
      ),
    },
  ];

  const filteredHistory = getFilteredHistory();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <Alert
            variant="error"
            className="mb-4 bg-red-50 text-red-900 rounded-xl"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Payment Settings
            </h2>
            <p className="text-[#5C7361] mt-1">
              Manage your payment gateway and view admin subscription payments
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-8">
          {isConnected ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#E8EFEA] flex items-center justify-center">
                  <div className="w-6 h-6 text-[#395917]">✓</div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#2C3B2A]">
                    Payment Gateway Status
                  </h3>
                  <p className="text-[#5C7361]">
                    Active and ready to process admin subscription payments
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA] mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by admin username or subscription year..."
                      className="w-full px-4 py-3 border border-[#E8EFEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#395917]/20"
                    />
                  </div>
                  <PaymentHistoryPDF
                    title="Subscription Payment History"
                    data={filteredHistory}
                    columns={columns}
                    filename="HamroSamajSubscriptionPaymentList"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#395917]"></div>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-[#5C7361]">
                    No subscription payment history available.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#2C3B2A] text-white">
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Admin
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Subscription Year
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Date
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          <div className="flex items-center gap-2">
                            Amount
                            <span className="text-white/50">|</span>
                          </div>
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          Status
                        </th>
                        <th className="px-8 py-4 text-left font-medium text-base">
                          Controls
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EFEA]">
                      {filteredHistory.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-[#F5F8F6] transition-colors"
                        >
                          <td className="px-8 py-5 text-base text-[#2C3B2A] font-medium">
                            {payment.admin_username}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            {payment.subscription_year}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-5 text-base text-[#5C7361]">
                            ₹{payment.amount}
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${getStatusClasses(payment.status_display || payment.status)}`}
                            >
                              {payment.status_display || payment.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm space-x-2">
                            <button
                              onClick={() =>
                                extendSubscriptionBy7Days(payment.admin)
                              }
                              className="px-3 py-1 rounded border border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            >
                              +7 days
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-[#2C3B2A] mb-4">
                Connect Payment Gateway
              </h3>
              <p className="text-[#5C7361] mb-8 max-w-md mx-auto">
                Set up your payment gateway to start accepting subscription
                payments from admins securely.
              </p>
              <button
                onClick={handleStripeConnect}
                disabled={loading}
                className="bg-[#395917] text-white px-8 py-3 rounded-lg hover:bg-[#2C3B2A] disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>Connect Payment Gateway</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperadminStripeSetup;
