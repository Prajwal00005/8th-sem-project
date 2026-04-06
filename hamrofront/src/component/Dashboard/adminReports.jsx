import React, { useEffect, useState } from "react";
import api from "../../utils/axiosConfig";

const AdminReports = () => {
  const [residentPayments, setResidentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResidentPayments = async () => {
      try {
        const res = await api.get("/api/v1/residentPaymentsReport/");
        setResidentPayments(res.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch resident payments report", err);
        setError("Failed to load payment report");
      } finally {
        setLoading(false);
      }
    };

    fetchResidentPayments();
  }, []);

  return (
    <div className="p-8 bg-[#F5F8F6] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Payment Reports
            </h2>
            <p className="text-[#5C7361] mt-1 text-sm md:text-base">
              Resident rent and bill payments for your apartment
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] px-4 py-3 text-sm text-[#5C7361] flex items-center justify-between gap-4 min-w-[220px]">
            <span>Total payments</span>
            <span className="text-lg font-semibold text-[#2C3B2A]">
              {residentPayments.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#F5F8F6] border-b border-[#E8EFEA]">
            <div>
              <h3 className="text-lg font-semibold text-[#2C3B2A]">
                Resident rent & bill payments
              </h3>
              <p className="text-xs text-[#5C7361]">
                All completed resident payments with date, period and amount
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-[#5C7361] text-sm">
              Loading payment report...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 text-sm">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#2C3B2A] text-white">
                    <th className="px-4 py-3 text-left font-medium">
                      Resident
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Room</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Period</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] bg-white">
                  {residentPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-[#5C7361] text-sm"
                      >
                        No resident payments found.
                      </td>
                    </tr>
                  ) : (
                    residentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-[#F5F8F6] transition-colors"
                      >
                        <td className="px-4 py-3 text-[#2C3B2A] font-medium">
                          {payment.resident_name}
                        </td>
                        <td className="px-4 py-3 text-[#5C7361]">
                          {payment.room_number}
                        </td>
                        <td className="px-4 py-3 text-[#5C7361] text-xs">
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#5C7361] text-xs">
                          {payment.period_from && payment.period_to
                            ? `${payment.period_from} to ${payment.period_to}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#2C3B2A]">
                          ₹{payment.amount}
                        </td>
                        <td className="px-4 py-3 text-[#5C7361] text-xs capitalize">
                          {payment.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
