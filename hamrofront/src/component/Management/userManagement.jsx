import React, { useEffect, useState } from 'react';
import { useUserManagementStore } from '../../store/userManagementStore';
import { Edit3, Trash2, UserPlus, X, Eye, DollarSign } from 'lucide-react';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Button } from '../UI/button';

const UserManagement = () => {
    const {
        filteredUsers,
        formData,
        editingUser,
        isFormVisible,
        searchTerm,
        roleFilter,
        setFormData,
        setSearchTerm,
        setRoleFilter,
        fetchUsers,
        fetchResidentPaymentSummary,
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
        recordManualRentPayment,
        startEditing,
        toggleFormVisibility,
        filterUsers,
        roleOptions,
        filterOptions
    } = useUserManagementStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [manualPayUser, setManualPayUser] = useState(null);
    const [manualPayPeriod, setManualPayPeriod] = useState({ from: '', to: '' });

    useEffect(() => {
        fetchUsers();
        fetchResidentPaymentSummary();
    }, [fetchUsers, fetchResidentPaymentSummary]);

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

    const openViewModal = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedUser(null);
    };

    const openManualPayModal = (user) => {
        setManualPayUser(user);
        setManualPayPeriod({ from: '', to: '' });
    };

    return (
        <div className="p-8 bg-[#F5F8F6]">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#2C3B2A]">User Management</h2>
                        <p className="text-[#5C7361] mt-1">Manage your team members and their account permissions</p>
                    </div>
                    <Button 
                        onClick={toggleFormVisibility}
                        icon={UserPlus}
                        className="bg-[#395917] hover:bg-[#2C3B2A] text-white px-6 py-3 rounded-lg"
                    >
                        {editingUser ? 'Cancel Editing' : 'Add User'}
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
                                <th className="px-8 py-4 text-right font-medium text-base">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EFEA]">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-[#F5F8F6] transition-colors">
                                    <td className="px-8 py-5 text-base text-[#2C3B2A] font-medium">{user.username}</td>
                                    <td className="px-8 py-5 text-base text-[#5C7361]">{user.email}</td>
                                    <td className="px-8 py-5 text-base text-[#2C3B2A]">{user.role}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-3 justify-end">
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Form Overlay */}
                {isFormVisible && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-[#2C3B2A]">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h3>
                                <Button 
                                    variant="secondary"
                                    onClick={toggleFormVisibility}
                                    icon={X}
                                    className="p-2 hover:bg-[#E8EFEA]"
                                />
                            </div>
                            <form onSubmit={editingUser ? handleEditUser : handleAddUser}
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
                                {!editingUser && (
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                )}
                                <Select
                                    label="Role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    options={roleOptions}
                                    required
                                />
                                {formData.role === 'resident' && (
                                    <>
                                        <Input
                                            label="Room Number"
                                            value={formData.room_number}
                                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                            required={!editingUser}
                                        />
                                        <Input
                                            label="Monthly Rent"
                                            type="text"
                                            value={formData.monthly_rent}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^\d.]/g, '');
                                                setFormData({ ...formData, monthly_rent: value });
                                            }}
                                            placeholder="0.00"
                                            required={!editingUser}
                                            className="font-mono"
                                        />
                                    </>
                                )}
                                {formData.role === 'security' && (
                                    <Input
                                        label="Yearly Salary"
                                        type="text"
                                        value={formData.salary}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^\d.]/g, '');
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
                                        {editingUser ? 'Update User' : 'Add User'}
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
                                Are you sure you want to delete {userToDelete?.username}? This action cannot be undone.
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

export default UserManagement;