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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              User Management
            </h2>
            <p className="text-[#5C7361] mt-1">
              Manage your team members and their account permissions
            </p>
          </div>
          <Button
            onClick={toggleFormVisibility}
            icon={UserPlus}
            className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
          >
            {editingUser ? "Cancel Editing" : "Add User"}
          </Button>
        </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="text-base py-3"
              />
            </div>
            <div className="md:w-64">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={filterOptions()}
                className="text-base py-3"
              />
            </div>
          </div>
        </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#2C3B2A] text-white">
                <th className="px-8 py-4 text-left font-medium text-base">
                  <div className="flex items-center gap-2">
                    Username
                    <span className="text-white/50">|</span>
                  </div>
                </th>
                <th className="px-8 py-4 text-left font-medium text-base">
                  <div className="flex items-center gap-2">
                    Email
                    <span className="text-white/50">|</span>
                  </div>
                </th>
                <th className="px-8 py-4 text-left font-medium text-base">
                  <div className="flex items-center gap-2">
                    Role
                    <span className="text-white/50">|</span>
                  </div>
                </th>
                <th className="px-8 py-4 text-right font-medium text-base">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EFEA]">
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
                const isResidentOverdue =
                  isResident &&
                  latestPeriodTo &&
                  latestPeriodTo < today &&
                  latestPayment?.status !== "advance";

                const latestSecurityPayment = isSecurity
                  ? getLatestSecurityPayment(user.id)
                  : null;
                const latestSecurityEnd =
                  latestSecurityPayment?.payment_end_date
                    ? new Date(latestSecurityPayment.payment_end_date)
                    : null;
                const isSecurityOverdue =
                  isSecurity &&
                  ((latestSecurityEnd && latestSecurityEnd < today) ||
                    !latestSecurityPayment);

                const isOverdue = isResidentOverdue || isSecurityOverdue;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-[#F5F8F6] transition-colors ${
                      isOverdue ? "bg-red-50" : ""
                    }`}
                  >
                    <td
                      className={`px-8 py-5 text-base font-medium ${
                        isOverdue ? "text-red-700" : "text-[#2C3B2A]"
                      }`}
                    >
                      {user.username}
                    </td>
                    <td className="px-8 py-5 text-base text-[#5C7361]">
                      {user.email}
                    </td>
                    <td className="px-8 py-5 text-base text-[#2C3B2A]">
                      {user.role}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => openViewModal(user)}
                          icon={Eye}
                          className="p-2.5"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => startEditing(user)}
                          icon={Edit3}
                          className="p-2.5"
                        />
                        <Button
                          variant="danger"
                          onClick={() => confirmDelete(user)}
                          icon={Trash2}
                          className="p-2.5"
                        />
                        {isResident && (
                          <Button
                            variant="secondary"
                            onClick={() => openPayModal(user)}
                            icon={CreditCard}
                            className="p-2.5"
                            title="Record manual rent payment"
                          />
                        )}
                        {isSecurity && (
                          <Button
                            variant="secondary"
                            onClick={() => openSecurityPayModal(user)}
                            icon={CreditCard}
                            className="p-2.5"
                            title="Record manual salary payment"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                  <span className="font-semibold">Name:</span>{" "}
                  {viewUser.username}
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
                            <span className="font-semibold">
                              Yearly Salary:
                            </span>{" "}
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
                    setSecurityPayError("Please enter payment year.");
                    return;
                  }
                  try {
                    await recordManualSecuritySalary({
                      securityId: securityUser.id,
                      payment_year: parseInt(securityYear, 10),
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
                <Input
                  label="Payment Year"
                  type="number"
                  value={securityYear}
                  onChange={(e) => setSecurityYear(e.target.value)}
                  required
                />
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
