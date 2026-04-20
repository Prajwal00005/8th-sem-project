import React, { useEffect, useState } from "react";
import { useSadminManagementStore } from "../../store/adminManagementStore";
import { Edit3, Trash2, UserPlus, X, Eye, CreditCard } from "lucide-react";
import { Input } from "../UI/input";
import { Button } from "../UI/button";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

const SadminManagement = () => {
  const {
    filteredAdmins,
    formData,
    editingAdmin,
    isFormVisible,
    searchTerm,
    isLoadingAdmins,
    adminPagination,
    setFormData,
    setSearchTerm,
    fetchAdmins,
    setAdminPage,
    setAdminPageSize,
    handleAddAdmin,
    handleEditAdmin,
    handleDeleteAdmin,
    startEditing,
    toggleFormVisibility,
    toggleAdminAccess,
    recordCashSubscription,
  } = useSadminManagementStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showManualPaymentConfirm, setShowManualPaymentConfirm] =
    useState(false);
  const [manualPaymentAdmin, setManualPaymentAdmin] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    fetchAdmins({
      page: adminPagination.page,
      pageSize: adminPagination.pageSize,
      search: debouncedSearch,
    });
  }, [
    adminPagination.page,
    adminPagination.pageSize,
    debouncedSearch,
    fetchAdmins,
  ]);

  const confirmDelete = (admin) => {
    setAdminToDelete(admin);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (adminToDelete) {
      handleDeleteAdmin(adminToDelete.id, async () => true);
      setShowConfirm(false);
      setAdminToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setAdminToDelete(null);
  };

  const getSubscriptionStatusClasses = (status) => {
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
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Admin Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage apartment administrators and their permissions
          </p>
        </div>
        <Button
          onClick={toggleFormVisibility}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {editingAdmin ? "Cancel Editing" : "Add Admin"}
        </Button>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setAdminPage(1);
            }}
            placeholder="Search apartments..."
            className="pl-8 h-8 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
          />
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
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
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-slate-600">Page size</label>
          <select
            value={adminPagination.pageSize}
            onChange={(e) => setAdminPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {adminPagination.hasPrevious && adminPagination.total > 0 && (
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={isLoadingAdmins}
              onClick={() => setAdminPage(adminPagination.page - 1)}
            >
              Previous
            </Button>
          )}

          {adminPagination.hasNext && adminPagination.total > 0 && (
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={isLoadingAdmins}
              onClick={() => setAdminPage(adminPagination.page + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Apartment
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Price
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Valid Till
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoadingAdmins ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Loading admins...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No admins found.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-800 text-sm">
                        {admin.apartmentName}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-slate-800 text-sm">
                        ₹
                        {admin.subscription_price
                          ? Number(admin.subscription_price).toFixed(2)
                          : "0.00"}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusClasses(admin.subscription_status)}`}
                      >
                        {admin.subscription_status || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {admin.subscription_end_date
                        ? new Date(
                            admin.subscription_end_date,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setViewAdmin(admin);
                            setShowViewModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEditing(admin)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setManualPaymentAdmin(admin);
                            setShowManualPaymentConfirm(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={admin.is_active}
                            onChange={() =>
                              toggleAdminAccess(admin.id, !admin.is_active)
                            }
                            className="sr-only peer"
                          />
                          <div
                            className={`w-8 h-4 rounded-full transition-colors ${
                              admin.is_active ? "bg-green-500" : "bg-slate-300"
                            } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${
                                admin.is_active
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>
                        </label>
                        <button
                          onClick={() => confirmDelete(admin)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/80">
          <p className="text-xs text-slate-600">
            Showing page {adminPagination.page} of{" "}
            {adminPagination.totalPages || 1} ({adminPagination.total} total)
          </p>
          {isLoadingAdmins && (
            <p className="text-xs text-slate-500">Updating...</p>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {viewAdmin && showViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                Apartment Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewAdmin(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Username
                </span>
                <span className="text-slate-800">{viewAdmin.username}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Email
                </span>
                <span className="text-slate-800">{viewAdmin.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Apartment
                </span>
                <span className="text-slate-800">
                  {viewAdmin.apartmentName}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Subscription Price
                </span>
                <span className="text-slate-800">
                  ₹
                  {viewAdmin.subscription_price
                    ? Number(viewAdmin.subscription_price).toFixed(2)
                    : "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Status
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusClasses(viewAdmin.subscription_status)}`}
                >
                  {viewAdmin.subscription_status || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">
                  Valid Till
                </span>
                <span className="text-slate-800">
                  {viewAdmin.subscription_end_date
                    ? new Date(
                        viewAdmin.subscription_end_date,
                      ).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500">
                  Access
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    viewAdmin.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {viewAdmin.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full p-8 border border-white/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </h3>
              <Button
                variant="secondary"
                onClick={toggleFormVisibility}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form
              onSubmit={editingAdmin ? handleEditAdmin : handleAddAdmin}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              {!editingAdmin && (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              )}
              <Input
                label="Apartment Name"
                value={formData.apartmentName}
                onChange={(e) =>
                  setFormData({ ...formData, apartmentName: e.target.value })
                }
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <Input
                label="Subscription Price"
                type="number"
                value={formData.subscription_price}
                onChange={(e) =>
                  setFormData({ subscription_price: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <div className="col-span-full flex justify-end gap-4 pt-4">
                <Button
                  variant="secondary"
                  onClick={toggleFormVisibility}
                  className="px-6 py-3 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-lg shadow-blue-500/25"
                >
                  {editingAdmin ? "Update Admin" : "Add Admin"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Confirm Delete
              </h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete {adminToDelete?.username}? This
                action cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="secondary"
                  onClick={handleCancelDelete}
                  className="px-6 py-3 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Subscription Payment Warning Modal */}
      {showManualPaymentConfirm && manualPaymentAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Record Manual Payment?
              </h3>
              <p className="text-slate-500 mb-4 text-sm">
                This will record a manual subscription payment for{" "}
                <span className="font-semibold">
                  {manualPaymentAdmin.apartmentName}
                </span>
                .
              </p>
              <p className="text-slate-500 mb-6 text-xs">
                Manual payments can be done multiple times. Only continue if you
                are sure this cash payment has actually been received and is not
                a duplicate.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowManualPaymentConfirm(false);
                    setManualPaymentAdmin(null);
                  }}
                  className="px-6 py-3 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await recordCashSubscription(manualPaymentAdmin.id);
                    setShowManualPaymentConfirm(false);
                    setManualPaymentAdmin(null);
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Yes, Record Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SadminManagement;
