import React, { useEffect } from "react";
import { useAdminBillStore } from "../../store/adminBillStore";

const AdminBillManagement = () => {
  const {
    aggregateBills,
    loading,
    error,
    fetchAggregateBills,
    updateAggregateBillStatus,
  } = useAdminBillStore();

  useEffect(() => {
    fetchAggregateBills();
  }, [fetchAggregateBills]);

  const formatDate = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  return (
    <div className="space-y-4 p-4">
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Bill Management
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          View security aggregate bills (owner expenses).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Security Aggregate Bills
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {aggregateBills.length} record
              {aggregateBills.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : aggregateBills.length === 0 ? (
          <div className="p-8 text-center">
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
            <p className="text-slate-500 text-sm">No aggregate bills found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-white/50">
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Security
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Total Bill Amount
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-slate-700 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {aggregateBills.map((bill) => {
                  const isPaid = bill.payment_status === "paid";
                  return (
                    <tr key={bill.id}>
                      <td className="px-6 py-3 text-sm text-slate-800">
                        {formatDate(bill.date)}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-800">
                        {bill.security_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-800">
                        ₹{parseFloat(bill.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            updateAggregateBillStatus(
                              bill.id,
                              isPaid ? "unpaid" : "paid",
                            )
                          }
                          className={`px-3 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                            isPaid
                              ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                              : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                          }`}
                          disabled={loading}
                        >
                          {isPaid ? "Mark Unpaid" : "Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBillManagement;
