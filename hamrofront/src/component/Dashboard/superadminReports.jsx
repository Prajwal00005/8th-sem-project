import React, { useEffect } from "react";
import { useSadminManagementStore } from "../../store/adminManagementStore";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

const SuperadminReports = () => {
  const {
    reportAdmins,
    reportStats,
    reportPagination,
    reportFilters,
    isLoadingReports,
    fetchReportAdmins,
    setReportFilters,
    setReportPage,
    setReportPageSize,
  } = useSadminManagementStore();

  useEffect(() => {
    fetchReportAdmins({
      page: reportPagination.page,
      pageSize: reportPagination.pageSize,
      status: reportFilters.status,
      dateFrom: reportFilters.dateFrom,
      dateTo: reportFilters.dateTo,
    });
  }, [
    fetchReportAdmins,
    reportPagination.page,
    reportPagination.pageSize,
    reportFilters.status,
    reportFilters.dateFrom,
    reportFilters.dateTo,
  ]);

  const stats = reportStats;

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
    <div className="space-y-5 p-4 lg:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Subscription Reports
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Overview of apartment subscriptions, payments, and outstanding
            amounts
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-600">
                From date
              </label>
              <input
                type="date"
                value={reportFilters.dateFrom}
                onChange={(e) => {
                  setReportFilters({ dateFrom: e.target.value });
                  setReportPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-600">
                To date
              </label>
              <input
                type="date"
                value={reportFilters.dateTo}
                onChange={(e) => {
                  setReportFilters({ dateTo: e.target.value });
                  setReportPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-600">
                Status
              </label>
              <select
                value={reportFilters.status}
                onChange={(e) => {
                  setReportFilters({ status: e.target.value });
                  setReportPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="extended">Extended</option>
                <option value="expired">Expired</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-600">
                Page size
              </label>
              <select
                value={reportPagination.pageSize}
                onChange={(e) => setReportPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              {stats.totalAdmins}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Total Apartments
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All registered properties
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
            <span className="text-xl font-semibold text-slate-800">
              {stats.subscribedCount}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Subscribed</h3>
          <p className="text-xs text-slate-500 mt-1">Active subscriptions</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              ₹{stats.outstandingAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Outstanding</h3>
          <p className="text-xs text-slate-500 mt-1">Pending payments</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              ₹{stats.collectedAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Collected</h3>
          <p className="text-xs text-slate-500 mt-1">Total revenue</p>
        </div>
      </div>

      {/* Subscription Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Subscription Records
              </h3>
              <p className="text-xs text-slate-500">
                Paginated records based on selected backend filters
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Showing page {reportPagination.page} of{" "}
              {reportPagination.totalPages || 1} ({reportPagination.total}{" "}
              records)
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Apartment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Valid Till
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoadingReports ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Loading report data...
                  </td>
                </tr>
              ) : reportAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No subscriptions found for the selected filters.
                  </td>
                </tr>
              ) : (
                reportAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-sm">
                        {admin.apartmentName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {admin.username}
                    </td>
                    <td className="px-4 py-3">
                      {admin.subscription_status ? (
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-medium ${getStatusClasses(admin.subscription_status)}`}
                        >
                          {admin.subscription_status}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-sm">
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
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {admin.subscription_end_date
                        ? new Date(
                            admin.subscription_end_date,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 disabled:opacity-40"
            disabled={!reportPagination.hasPrevious || isLoadingReports}
            onClick={() => setReportPage(reportPagination.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 disabled:opacity-40"
            disabled={!reportPagination.hasNext || isLoadingReports}
            onClick={() => setReportPage(reportPagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperadminReports;
