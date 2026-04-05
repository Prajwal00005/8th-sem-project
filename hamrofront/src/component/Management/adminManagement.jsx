import React, { useEffect, useState } from 'react';
import { useSadminManagementStore } from '../../store/adminManagementStore';
import { Edit3, Trash2, UserPlus,X } from 'lucide-react';
import { Input } from '../UI/input';
import { Button } from '../UI/button';


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
        filterAdmins
    } = useSadminManagementStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);

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

    return (
        <div className="p-8 bg-[#F5F8F6]">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#2C3B2A]">Admin Management</h2>
                        <p className="text-[#5C7361] mt-1">Manage apartment administrators and their permissions</p>
                    </div>
                    <Button 
                        onClick={toggleFormVisibility}
                        icon={UserPlus}
                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
                    >
                        {editingAdmin ? 'Cancel Editing' : 'Add Admin'}
                    </Button>
                </div>

                {/* Search Section */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E8EFEA]">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-grow">
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search admins..."
                                className="text-base py-3"
                            />
                        </div>
                    </div>
                </div>

                {/* Admins Table */}
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
                                        Apartment Name
                                        <span className="text-white/50">|</span>
                                    </div>
                                </th>
                                <th className="px-8 py-4 text-left font-medium text-base">
                                    <div className="flex items-center gap-2">
                                        Subscription Price
                                        <span className="text-white/50">|</span>
                                    </div>
                                </th>
                                <th className="px-8 py-4 text-right font-medium text-base">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EFEA]">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-[#F5F8F6] transition-colors">
                                    <td className="px-8 py-5 text-base text-[#2C3B2A] font-medium">{admin.username}</td>
                                    <td className="px-8 py-5 text-base text-[#5C7361]">{admin.email}</td>
                                    <td className="px-8 py-5 text-base text-[#2C3B2A]">{admin.apartmentName}</td>
                                    <td className="px-8 py-5 text-base text-[#5C7361]">
                                        ₹{admin.subscription_price ? Number(admin.subscription_price).toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-3 justify-end">
                                            <Button 
                                                variant="secondary"
                                                onClick={() => startEditing(admin)}
                                                icon={Edit3}
                                                className="p-2.5"
                                            />
                                            <Button 
                                                variant="danger"
                                                onClick={() => confirmDelete(admin)}
                                                icon={Trash2}
                                                className="p-2.5"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Form Modal */}
                {isFormVisible && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-[#2C3B2A]">
                                    {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                                </h3>
                                <Button 
                                    variant="secondary"
                                    onClick={toggleFormVisibility}
                                    icon={X}
                                    className="p-2 hover:bg-[#E8EFEA]"
                                />
                            </div>
                            <form onSubmit={editingAdmin ? handleEditAdmin : handleAddAdmin}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                {!editingAdmin && (
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                )}
                                <Input
                                    label="Apartment Name"
                                    value={formData.apartmentName}
                                    onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Subscription Price"
                                    type="number"
                                    value={formData.subscription_price}
                                    onChange={(e) => setFormData({ subscription_price: e.target.value })}//new field
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
                                        {editingAdmin ? 'Update Admin' : 'Add Admin'}
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
                                Are you sure you want to delete {adminToDelete?.username}? This action cannot be undone.
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