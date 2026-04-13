import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosConfig";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get("/api/v1/adminFinancialReport/");
        setReport(res.data || null);
        setTransactions(res.data?.transactions || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch admin financial report", err);
        setError("Failed to load financial report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const filteredTransactions = useMemo(() => {
    const from = dateFrom ? parseDate(dateFrom) : null;
    const to = dateTo ? parseDate(dateTo) : null;

    return transactions.filter((tx) => {
      const txDate = parseDate(tx.date);
      if (!txDate) return false;
      if (from && txDate < from) return false;
      if (to && txDate > to) return false;

      if (typeFilter !== "all") {
        const t = (tx.type || "").toLowerCase();
        if (t !== typeFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [transactions, dateFrom, dateTo, typeFilter]);

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((tx) => {
      income += Number(tx.income) || 0;
      expenses += Number(tx.expense) || 0;
    });

    return {
      income,
      expenses,
      profit: income - expenses,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Financial Reports
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-slate-500">Loading financial report...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(report?.total_rent_income)}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-800">Rent Income</h3>
              <p className="text-xs text-slate-500 mt-1">Monthly rent collections</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
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
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(report?.total_bill_income)}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-800">Bill Income</h3>
              <p className="text-xs text-slate-500 mt-1">Individual bill payments</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(report?.total_expenses)}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-800">Total Expenses</h3>
              <p className="text-xs text-slate-500 mt-1">Maintenance & operations</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  (report?.profit_loss || 0) >= 0
                    ? "bg-gradient-to-br from-emerald-500 to-green-600"
                    : "bg-gradient-to-br from-red-500 to-pink-600"
                }`}>
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <span className={`text-sm font-bold ${
                  (report?.profit_loss || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {formatCurrency(report?.profit_loss)}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-800">Profit / Loss</h3>
              <p className="text-xs text-slate-500 mt-1">Net financial result</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    Income & Expense Transactions
                  </h3>
                  <p className="text-sm text-slate-500">
                    Filter by date and type to analyze profit/loss.
                  </p>
                </div>
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
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="all">All</option>
                      <option value="rent">Rent</option>
                      <option value="bill">Bill</option>
                      <option value="security salary">Security salary</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Income
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Expenses
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
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
                          No transactions found for the selected filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, index) => (
                      <tr
                        key={tx.id || index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {tx.name || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-semibold text-emerald-600">
                            {tx.income ? formatCurrency(tx.income) : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-semibold text-red-600">
                            {tx.expense ? formatCurrency(tx.expense) : "-"}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 text-slate-800 font-semibold">
                    <td className="px-6 py-4" colSpan={4}>
                      Total (filtered)
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600">
                      {formatCurrency(totals.income)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {formatCurrency(totals.expenses)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
