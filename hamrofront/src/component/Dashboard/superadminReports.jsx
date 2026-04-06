import React, { useEffect, useMemo, useState } from "react";
import { useSadminManagementStore } from "../../store/adminManagementStore";

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatMonthLabel = (date) => {
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

const SuperadminReports = () => {
  const { admins, fetchAdmins } = useSadminManagementStore();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = useMemo(() => {
    const from = dateFrom ? parseDate(dateFrom) : null;
    const to = dateTo ? parseDate(dateTo) : null;

    return admins.filter((admin) => {
      const status = admin.subscription_status || "unpaid";
      if (statusFilter !== "all" && status !== statusFilter) return false;

      const endDate = parseDate(admin.subscription_end_date);
      if (from && (!endDate || endDate < from)) return false;
      if (to && (!endDate || endDate > to)) return false;

      return true;
    });
  }, [admins, dateFrom, dateTo, statusFilter]);

  const paidAdmins = useMemo(
    () =>
      filteredAdmins.filter((admin) => {
        const status = admin.subscription_status || "unpaid";
        return status === "active" || status === "extended";
      }),
    [filteredAdmins],
  );

  const stats = useMemo(() => {
    const totalAdmins = admins.length;
    let subscribedCount = 0;
    let unpaidCount = 0;
    let totalAmount = 0;
    let collectedAmount = 0;
    let outstandingAmount = 0;

    admins.forEach((admin) => {
      const price = Number(admin.subscription_price) || 0;
      totalAmount += price;
      const status = admin.subscription_status || "unpaid";
      if (status === "active" || status === "extended") {
        subscribedCount += 1;
        collectedAmount += price;
      } else {
        unpaidCount += 1;
        outstandingAmount += price;
      }
    });

    return {
      totalAdmins,
      subscribedCount,
      unpaidCount,
      totalAmount,
      collectedAmount,
      outstandingAmount,
    };
  }, [admins]);

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "extended":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Subscription Reports
            </h2>
            <p className="text-[#5C7361] mt-1 text-sm md:text-base">
              Overview of apartment subscriptions, payments, and outstanding
              amounts
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#5C7361]">From date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-[#E8EFEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#395917] bg-[#F5F8F6]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#5C7361]">To date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-[#E8EFEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#395917] bg-[#F5F8F6]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#5C7361]">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#E8EFEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#395917] bg-[#F5F8F6]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="extended">Extended</option>
                <option value="expired">Expired</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
            <p className="text-xs text-[#5C7361]">Total Apartments</p>
            <p className="text-2xl font-semibold text-[#2C3B2A] mt-1">
              {stats.totalAdmins}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
            <p className="text-xs text-[#5C7361]">Subscribed</p>
            <p className="text-2xl font-semibold text-[#395917] mt-1">
              {stats.subscribedCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
            <p className="text-xs text-[#5C7361]">Outstanding</p>
            <p className="text-2xl font-semibold text-[#B91C1C] mt-1">
              ₹{stats.outstandingAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
            <p className="text-xs text-[#5C7361]">Collected</p>
            <p className="text-2xl font-semibold text-[#2C3B2A] mt-1">
              ₹{stats.collectedAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#F5F8F6] border-b border-[#E8EFEA]">
            <div>
              <h3 className="text-lg font-semibold text-[#2C3B2A]">
                Paid subscriptions
              </h3>
              <p className="text-xs text-[#5C7361]">
                Detailed list of apartments with active or extended
                subscriptions
              </p>
            </div>
            <p className="text-xs text-[#5C7361]">
              Showing {paidAdmins.length} paid of {admins.length} apartments
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#2C3B2A] text-white">
                  <th className="px-4 py-3 text-left font-medium">Apartment</th>
                  <th className="px-4 py-3 text-left font-medium">Admin</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Subscription price
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Valid till
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EFEA] bg-white">
                {paidAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[#5C7361] text-sm"
                    >
                      No paid subscriptions found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paidAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-[#F5F8F6] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#2C3B2A] font-medium">
                        {admin.apartmentName}
                      </td>
                      <td className="px-4 py-3 text-[#5C7361]">
                        {admin.username}
                      </td>
                      <td className="px-4 py-3">
                        {admin.subscription_status ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getStatusClasses(
                              admin.subscription_status,
                            )}`}
                          >
                            {admin.subscription_status}
                          </span>
                        ) : (
                          <span className="text-xs text-[#5C7361]">Unpaid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#2C3B2A]">
                        ₹
                        {admin.subscription_price
                          ? Number(admin.subscription_price).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "0.00"}
                      </td>
                      <td className="px-4 py-3 text-[#5C7361] text-xs">
                        {admin.subscription_end_date
                          ? parseDate(
                              admin.subscription_end_date,
                            )?.toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminReports;
