import React, { useEffect, useState } from "react";
import { useSadminManagementStore } from "../../store/adminManagementStore";
import { Edit3, Trash2, UserPlus, X, Eye, CreditCard } from "lucide-react";
import { Input } from "../UI/input";
import { Button } from "../UI/button";

const SadminManagement = () => {
  const {
    filteredAdmins,
    formData,
    editingAdmin,
    isFormVisible,
    searchTerm,
    setFormData,
    setSearchTerm,
    fetchAdmins,
    handleAddAdmin,
    handleEditAdmin,
    handleDeleteAdmin,
    startEditing,
    toggleFormVisibility,
    filterAdmins,
    toggleAdminAccess,
    recordCashSubscription,
  } = useSadminManagementStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    filterAdmins();
  }, [searchTerm, filterAdmins]);

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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C3B2A]">
              Admin Management
            </h2>
            <p className="text-[#5C7361] mt-1">
              Manage apartment administrators and their permissions
            </p>
          </div>
          <Button
            onClick={toggleFormVisibility}
            icon={UserPlus}
            className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
          >
            {editingAdmin ? "Cancel Editing" : "Add Admin"}
          </Button>
        </div>

        {/* Search Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or apartment..."
                className="text-base py-3"
              />
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EFEA] p-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Apartment
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Subscription Price
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Subscription Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Valid Till
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Access
                  </th>
                  <th className="px-4 py-2  font-medium text-gray-700 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">
                      {admin.apartmentName}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      ₹
                      {admin.subscription_price
                        ? Number(admin.subscription_price).toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-4 py-2">
                      {admin.subscription_status ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getSubscriptionStatusClasses(admin.subscription_status)}`}
                        >
                          {admin.subscription_status}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {admin.subscription_end_date
                        ? new Date(
                            admin.subscription_end_date,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          toggleAdminAccess(admin.id, !admin.is_active)
                        }
                        className={`relative inline-flex items-center h-5 w-10 rounded-full transition-colors duration-150 focus:outline-none ${
                          admin.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 ${
                            admin.is_active ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setViewAdmin(admin);
                            setShowViewModal(true);
                          }}
                          className="text-xs px-2 py-1.5 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => startEditing(admin)}
                          className="text-xs px-2 py-1.5 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => recordCashSubscription(admin.id)}
                          className="text-xs px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 border-0 flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => confirmDelete(admin)}
                          className="text-xs px-2 py-1.5 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Details Modal */}
        {viewAdmin && showViewModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#2C3B2A]">
                  Apartment Details
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewAdmin(null);
                  }}
                  className="p-2 hover:bg-[#E8EFEA] rounded-full"
                >
                  <X className="w-5 h-5 text-[#2C3B2A]" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-[#2C3B2A]">
                <div className="flex justify-between">
                  <span className="font-medium">Username:</span>
                  <span>{viewAdmin.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{viewAdmin.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Apartment:</span>
                  <span>{viewAdmin.apartmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Subscription Price:</span>
                  <span>
                    ₹
                    {viewAdmin.subscription_price
                      ? Number(viewAdmin.subscription_price).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Subscription Status:</span>
                  <span>{viewAdmin.subscription_status || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Valid Till:</span>
                  <span>
                    {viewAdmin.subscription_end_date
                      ? new Date(
                          viewAdmin.subscription_end_date,
                        ).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Access:</span>
                  <span>{viewAdmin.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {isFormVisible && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#2C3B2A]">
                  {editingAdmin ? "Edit Admin" : "Add New Admin"}
                </h3>
                <Button
                  variant="secondary"
                  onClick={toggleFormVisibility}
                  icon={X}
                  className="p-2 hover:bg-[#E8EFEA]"
                />
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
                {!editingAdmin && (
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
                <Input
                  label="Apartment Name"
                  value={formData.apartmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, apartmentName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Subscription Price"
                  type="number"
                  value={formData.subscription_price}
                  onChange={(e) =>
                    setFormData({ subscription_price: e.target.value })
                  } //new field
                  required
                  min="0"
                  step="0.01"
                />
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
                    {editingAdmin ? "Update Admin" : "Add Admin"}
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
                Are you sure you want to delete {adminToDelete?.username}? This
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
      </div>
    </div>
  );
};

export default SadminManagement;
