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
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Subscription Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of apartment subscriptions, payments, and outstanding
            amounts
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                From date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                To date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              {stats.totalAdmins}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Total Apartments
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            All registered properties
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-2xl font-bold text-slate-800">
              {stats.subscribedCount}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Subscribed</h3>
          <p className="text-sm text-slate-500 mt-1">Active subscriptions</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-2xl font-bold text-slate-800">
              ₹{stats.outstandingAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Outstanding</h3>
          <p className="text-sm text-slate-500 mt-1">Pending payments</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              ₹{stats.collectedAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Collected</h3>
          <p className="text-sm text-slate-500 mt-1">Total revenue</p>
        </div>
      </div>

      {/* Paid Subscriptions Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Paid Subscriptions
              </h3>
              <p className="text-sm text-slate-500">
                Detailed list of apartments with active or extended
                subscriptions
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Showing {paidAdmins.length} paid of {admins.length} apartments
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Apartment
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Admin
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Valid Till
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paidAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
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
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H6"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500">
                      No paid subscriptions found for the selected filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paidAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {admin.apartmentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {admin.username}
                    </td>
                    <td className="px-6 py-4">
                      {admin.subscription_status ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(admin.subscription_status)}`}
                        >
                          {admin.subscription_status}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
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
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
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
  );
};

export default SuperadminReports;
