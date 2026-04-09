import React, { useEffect, useMemo, useState } from "react";
import { useUserManagementStore } from "../../store/userManagementStore";
import { Edit3, Trash2, UserPlus, X, Eye, CreditCard } from "lucide-react";
import { Input } from "../UI/input";
import { Select } from "../UI/select";
import { Button } from "../UI/button";

const UserManagement = () => {
  const {
    filteredUsers,
    payments,
    securityPayments,
    formData,
    editingUser,
    isFormVisible,
    searchTerm,
    roleFilter,
    setFormData,
    setSearchTerm,
    setRoleFilter,
    fetchUsers,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    startEditing,
    toggleFormVisibility,
    filterUsers,
    roleOptions,
    filterOptions,
    recordManualRent,
    recordManualSecuritySalary,
  } = useUserManagementStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [payUser, setPayUser] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPeriodFrom, setPayPeriodFrom] = useState("");
  const [payPeriodTo, setPayPeriodTo] = useState("");
  const [payError, setPayError] = useState("");
  const [securityUser, setSecurityUser] = useState(null);
  const [showSecurityPayModal, setShowSecurityPayModal] = useState(false);
  const [securityYear, setSecurityYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [securityMonth, setSecurityMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [securityPayError, setSecurityPayError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, filterUsers]);

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      handleDeleteUser(userToDelete.id);
      setShowConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setUserToDelete(null);
  };

  const today = useMemo(() => new Date(), []);

  const getLatestPaymentForResident = (residentId) => {
    if (!payments || payments.length === 0) return null;
    const residentPayments = payments.filter((p) => p.resident === residentId);
    if (residentPayments.length === 0) return null;
    return residentPayments.reduce((latest, current) => {
      if (!latest) return current;
      const latestDate = new Date(latest.period_to || latest.created_at);
      const currentDate = new Date(current.period_to || current.created_at);
      return currentDate > latestDate ? current : latest;
    }, null);
  };

  const getLatestSecurityPayment = (securityId) => {
    if (!securityPayments || securityPayments.length === 0) return null;
    const list = securityPayments.filter((p) => p.security === securityId);
    if (list.length === 0) return null;
    return list.reduce((latest, current) => {
      if (!latest) return current;
      const latestDate = new Date(latest.payment_end_date || latest.created_at);
      const currentDate = new Date(
        current.payment_end_date || current.created_at,
      );
      return currentDate > latestDate ? current : latest;
    }, null);
  };

  const getResidentDueInfo = (user) => {
    if (!user || user.role !== "resident") return null;
    const roomDetails = user.room_details;
    if (!roomDetails || !roomDetails.monthly_rent) return null;

    const latestPayment = getLatestPaymentForResident(user.id);
    const monthlyRent = Number(roomDetails.monthly_rent) || 0;

    let nextStart;
    if (latestPayment?.period_to) {
      const d = new Date(latestPayment.period_to);
      d.setDate(d.getDate() + 1);
      nextStart = d;
    } else {
      const d = new Date();
      d.setDate(1);
      nextStart = d;
    }

    const millisPerDay = 1000 * 60 * 60 * 24;
    const daysDiff = Math.floor((today - nextStart) / millisPerDay) + 1;
    const overdueMonths = daysDiff > 0 ? Math.floor(daysDiff / 30) + 1 : 0;

    const monthsToPay = overdueMonths > 0 ? overdueMonths : 1;
    const periodEnd = new Date(nextStart);
    periodEnd.setDate(periodEnd.getDate() + monthsToPay * 30 - 1);

    const dueAmount = monthlyRent * monthsToPay;

    return {
      nextPeriodFrom: nextStart.toISOString().split("T")[0],
      nextPeriodTo: periodEnd.toISOString().split("T")[0],
      monthsToPay,
      dueAmount,
      isOverdue: overdueMonths > 0,
    };
  };

  const openViewModal = (user) => {
    setViewUser(user);
    setShowViewModal(true);
  };

  const openPayModal = (user) => {
    const latestPayment = getLatestPaymentForResident(user.id);
    let nextFrom = "";
    if (latestPayment?.period_to) {
      const d = new Date(latestPayment.period_to);
      d.setDate(d.getDate() + 1);
      nextFrom = d.toISOString().split("T")[0];
    } else {
      const d = new Date();
      d.setDate(1);
      nextFrom = d.toISOString().split("T")[0];
    }

    setPayUser(user);
    setPayPeriodFrom(nextFrom);
    setPayPeriodTo("");
    setPayError("");
    setShowPayModal(true);
  };

  const openSecurityPayModal = (user) => {
    const latest = getLatestSecurityPayment(user.id);
    const currentYear = new Date().getFullYear();
    const nextYear = latest?.payment_year
      ? latest.payment_year + 1
      : currentYear;
    setSecurityUser(user);
    setSecurityYear(nextYear.toString());
    setSecurityPayError("");
    setShowSecurityPayModal(true);
  };

  const openManualRentModal = (user) => {
    const latestPayment = getLatestPaymentForResident(user.id);
    let nextFrom = "";
    if (latestPayment?.period_to) {
      const d = new Date(latestPayment.period_to);
      d.setDate(d.getDate() + 1);
      nextFrom = d.toISOString().split("T")[0];
    } else {
      const d = new Date();
      d.setDate(1);
      nextFrom = d.toISOString().split("T")[0];
    }

    setPayUser(user);
    setPayPeriodFrom(nextFrom);
    // Default to one 30-day month period from nextFrom
    const fromDate = new Date(nextFrom);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 29);
    setPayPeriodTo(toDate.toISOString().split("T")[0]);
    setPayError("");
    setShowPayModal(true);
  };

  const openManualBillModal = (user) => {
    setPayUser(user);
    setPayPeriodFrom("");
    setPayPeriodTo("");
    setPayError("");
    setShowPayModal(true);
  };

  const openManualSalaryModal = (user) => {
    const latest = getLatestSecurityPayment(user.id);
    const currentYear = new Date().getFullYear();
    const nextYear = latest?.payment_year
      ? latest.payment_year + 1
      : currentYear;
    setSecurityUser(user);
    setSecurityYear(nextYear.toString());
    setSecurityPayError("");
    setShowSecurityPayModal(true);
  };

  const handleManualRentSubmit = async (e) => {
    e.preventDefault();
    if (!payUser) return;
    if (!payPeriodFrom || !payPeriodTo) {
      setPayError("Please select both start and end dates.");
      return;
    }
    try {
      await recordManualRent({
        residentId: payUser.id,
        period_from: payPeriodFrom,
        period_to: payPeriodTo,
      });
      setShowPayModal(false);
      setPayUser(null);
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.error) {
        setPayError(apiError.error);
      } else if (apiError?.suggested_period_to) {
        setPayError(apiError.error || "Invalid period selected.");
        setPayPeriodTo(apiError.suggested_period_to);
      } else {
        setPayError("Failed to record manual rent. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Manage your team members and their account permissions
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-white/50 border border-white/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
        >
          {filterOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button
          onClick={toggleFormVisibility}
          icon={UserPlus}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
        >
          {editingUser ? "Cancel Editing" : "Add User"}
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Username
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Role
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const isResident = user.role === "resident";
                const isSecurity = user.role === "security";
                const roomDetails = user.room_details || null;
                const latestPayment = isResident
                  ? getLatestPaymentForResident(user.id)
                  : null;
                const latestPeriodTo = latestPayment?.period_to
                  ? new Date(latestPayment.period_to)
                  : null;
                const nextMonthFirst = new Date(
                  latestPeriodTo?.getFullYear() || new Date().getFullYear(),
                  (latestPeriodTo?.getMonth() || new Date().getMonth()) + 1,
                  1,
                );
                const isOverdue =
                  isResident &&
                  latestPeriodTo &&
                  nextMonthFirst < new Date() &&
                  !user.has_pending_manual_payment;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-800 text-sm">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-slate-600 text-sm">{user.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isResident
                            ? "bg-blue-100 text-blue-800"
                            : isSecurity
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {isResident && (
                          <>
                            <button
                              onClick={() => openManualRentModal(user)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Record Manual Rent"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                            {roomDetails && (
                              <button
                                onClick={() => openManualBillModal(user)}
                                className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Record Manual Bill"
                              >
                                <svg
                                  className="w-4 h-4"
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
                              </button>
                            )}
                          </>
                        )}
                        {isSecurity && (
                          <button
                            onClick={() => openManualSalaryModal(user)}
                            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Record Manual Salary"
                          >
                            <svg
                              className="w-4 h-4"
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
                          </button>
                        )}
                        <button
                          onClick={() => startEditing(user)}
                          className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(user)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Overlay */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#2C3B2A]">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>
              <Button
                variant="secondary"
                onClick={toggleFormVisibility}
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
            <form
              onSubmit={editingUser ? handleEditUser : handleAddUser}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              {!editingUser && (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              )}
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                options={roleOptions}
                required
              />
              {formData.role === "resident" && (
                <>
                  <Input
                    label="Room Number"
                    value={formData.room_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        room_number: e.target.value,
                      })
                    }
                    required={!editingUser}
                  />
                  <Input
                    label="Monthly Rent"
                    type="text"
                    value={formData.monthly_rent}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, "");
                      setFormData({ ...formData, monthly_rent: value });
                    }}
                    placeholder="0.00"
                    required={!editingUser}
                    className="font-mono"
                  />
                </>
              )}
              {formData.role === "security" && (
                <Input
                  label="Yearly Salary"
                  type="text"
                  value={formData.salary}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, "");
                    setFormData({ ...formData, salary: value });
                  }}
                  placeholder="0.00"
                  required
                  className="font-mono"
                />
              )}
              <div className="col-span-full flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={toggleFormVisibility}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
                >
                  {editingUser ? "Update User" : "Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-[#2C3B2A] mb-4">
              Confirm Delete
            </h3>
            <p className="text-[#5C7361] mb-6">
              Are you sure you want to delete {userToDelete?.username}? This
              action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button
                variant="secondary"
                onClick={handleCancelDelete}
                className="px-6 py-2.5"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resident View Modal */}
      {showViewModal && viewUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#2C3B2A]">
                Resident Details
              </h3>
              <Button
                variant="secondary"
                onClick={() => setShowViewModal(false)}
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
            <div className="space-y-3 text-sm text-[#2C3B2A]">
              <p>
                <span className="font-semibold">Name:</span> {viewUser.username}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {viewUser.email}
              </p>
              <p>
                <span className="font-semibold">Role:</span> {viewUser.role}
              </p>
              {viewUser.role === "resident" && viewUser.room_details && (
                <>
                  <p>
                    <span className="font-semibold">Room Number:</span>{" "}
                    {viewUser.room_details.room_number}
                  </p>
                  <p>
                    <span className="font-semibold">Monthly Rent:</span> ₹
                    {viewUser.room_details.monthly_rent}
                  </p>
                </>
              )}
              {viewUser.role === "resident" &&
                (() => {
                  const latestPayment = getLatestPaymentForResident(
                    viewUser.id,
                  );
                  const dueInfo = getResidentDueInfo(viewUser);

                  return (
                    <>
                      {latestPayment && (
                        <>
                          <p>
                            <span className="font-semibold">
                              Last Paid Period:
                            </span>{" "}
                            {latestPayment.period_from} to{" "}
                            {latestPayment.period_to}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Last Payment Status:
                            </span>{" "}
                            {latestPayment.status}
                          </p>
                        </>
                      )}
                      {dueInfo && (
                        <>
                          <p>
                            <span className="font-semibold">
                              Next Due Period:
                            </span>{" "}
                            {dueInfo.nextPeriodFrom} to {dueInfo.nextPeriodTo}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Estimated Due Amount:
                            </span>{" "}
                            ₹{dueInfo.dueAmount.toFixed(2)}
                          </p>
                          {dueInfo.isOverdue && (
                            <p className="text-red-600 text-xs">
                              Overdue for approximately {dueInfo.monthsToPay}{" "}
                              month(s).
                            </p>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              {viewUser.role === "security" &&
                (() => {
                  const latest = getLatestSecurityPayment(viewUser.id);
                  const salary = Number(viewUser.salary) || 0;
                  const currentYear = today.getFullYear();
                  let overdueYears = 0;
                  if (latest?.payment_end_date) {
                    const end = new Date(latest.payment_end_date);
                    if (end < today) {
                      overdueYears = Math.max(
                        1,
                        currentYear - latest.payment_year,
                      );
                    }
                  } else if (!latest && salary > 0) {
                    overdueYears = 1;
                  }
                  const dueSalary = overdueYears * salary;
                  return (
                    <>
                      {salary > 0 && (
                        <p>
                          <span className="font-semibold">Yearly Salary:</span>{" "}
                          ₹{salary.toFixed(2)}
                        </p>
                      )}
                      {latest && (
                        <>
                          <p>
                            <span className="font-semibold">
                              Last Payment Year:
                            </span>{" "}
                            {latest.payment_year}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Last Payment Ends:
                            </span>{" "}
                            {latest.payment_end_date}
                          </p>
                        </>
                      )}
                      {overdueYears > 0 && (
                        <>
                          <p className="text-red-600 text-xs">
                            Salary overdue for approximately {overdueYears}{" "}
                            year(s).
                          </p>
                          {dueSalary > 0 && (
                            <p>
                              <span className="font-semibold">
                                Estimated Due Salary:
                              </span>{" "}
                              ₹{dueSalary.toFixed(2)}
                            </p>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* Manual Rent Payment Modal */}
      {showPayModal && payUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#2C3B2A]">
                Record Manual Rent Payment
              </h3>
              <Button
                variant="secondary"
                onClick={() => setShowPayModal(false)}
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
            <form onSubmit={handleManualRentSubmit} className="space-y-4">
              <p className="text-sm text-[#5C7361]">
                Resident:{" "}
                <span className="font-semibold text-[#2C3B2A]">
                  {payUser.username}
                </span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Period From"
                  type="date"
                  value={payPeriodFrom}
                  onChange={(e) => setPayPeriodFrom(e.target.value)}
                  required
                />
                <Input
                  label="Period To"
                  type="date"
                  value={payPeriodTo}
                  onChange={(e) => setPayPeriodTo(e.target.value)}
                  required
                />
              </div>
              {(() => {
                if (
                  !payUser?.room_details?.monthly_rent ||
                  !payPeriodFrom ||
                  !payPeriodTo
                ) {
                  return null;
                }
                const from = new Date(payPeriodFrom);
                const to = new Date(payPeriodTo);
                const msPerDay = 1000 * 60 * 60 * 24;
                const days = Math.floor((to - from) / msPerDay) + 1;
                if (days <= 0) return null;
                const months = days / 30;
                if (!Number.isInteger(months)) {
                  return (
                    <p className="text-xs text-amber-700 mt-1">
                      Tip: choose full 30-day blocks so the system can calculate
                      whole months (30, 60, 90 days, ...).
                    </p>
                  );
                }
                const monthlyRent = Number(payUser.room_details.monthly_rent);
                const total = monthlyRent * months;
                return (
                  <p className="text-xs text-[#2C3B2A] mt-1">
                    This will record{" "}
                    <span className="font-semibold">{months}</span> month(s) of
                    rent for a total of{" "}
                    <span className="font-semibold">₹{total.toFixed(2)}</span>.
                    The payment will be marked as paid/advance automatically
                    based on the selected period.
                  </p>
                );
              })()}
              {payError && <p className="text-sm text-red-600">{payError}</p>}
              <div className="flex justify-end gap-4 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPayModal(false)}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
                >
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Security Salary Payment Modal */}
      {showSecurityPayModal && securityUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#2C3B2A]">
                Record Manual Security Salary
              </h3>
              <Button
                variant="secondary"
                onClick={() => setShowSecurityPayModal(false)}
                icon={X}
                className="p-2 hover:bg-[#E8EFEA]"
              />
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!securityUser) return;
                if (!securityYear) {
                  setSecurityPayError("Please select payment year.");
                  return;
                }
                try {
                  await recordManualSecuritySalary({
                    securityId: securityUser.id,
                    payment_year: parseInt(securityYear, 10),
                    payment_month: parseInt(securityMonth, 10),
                  });
                  setShowSecurityPayModal(false);
                  setSecurityUser(null);
                  setSecurityPayError("");
                } catch (err) {
                  const apiError = err.response?.data;
                  if (apiError?.error) {
                    setSecurityPayError(apiError.error);
                  } else {
                    setSecurityPayError(
                      "Failed to record security salary. Please try again.",
                    );
                  }
                }
              }}
              className="space-y-4"
            >
              <p className="text-sm text-[#5C7361]">
                Security User:{" "}
                <span className="font-semibold text-[#2C3B2A]">
                  {securityUser.username}
                </span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salary Month
                  </label>
                  <select
                    value={securityMonth}
                    onChange={(e) => setSecurityMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((m, index) => (
                      <option key={m} value={index + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salary Year
                  </label>
                  <input
                    type="number"
                    value={securityYear}
                    onChange={(e) => setSecurityYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              {securityPayError && (
                <p className="text-sm text-red-600">{securityPayError}</p>
              )}
              <div className="flex justify-end gap-4 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSecurityPayModal(false)}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-2.5"
                >
                  Save Salary
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
