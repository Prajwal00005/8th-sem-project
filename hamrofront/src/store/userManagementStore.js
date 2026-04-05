import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useUserManagementStore = create((set, get) => ({
    users: [],
    filteredUsers: [],
    formData: { username: '', email: '', password: '', role: 'resident', room_number: '', monthly_rent: '',salary:'' },
    editingUser: null,
    isFormVisible: false,
    searchTerm: '',
    roleFilter: '',

    setUsers: (users) => set({ users, filteredUsers: users }),
    setFormData: (updates) => set((state) => ({ formData: { ...state.formData, ...updates } })),
    setEditingUser: (user) => set({ editingUser: user }),
    setIsFormVisible: (visible) => set({ isFormVisible: visible }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setRoleFilter: (filter) => set({ roleFilter: filter }),

    fetchUsers: async () => {
        try {
            const response = await axios.get('/api/v1/userList/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            console.log('Fetched users:', response.data);
            set({ users: response.data, filteredUsers: response.data });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    },

    handleAddUser: async (event) => {
        event.preventDefault();
        const { formData } = get();
        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };
            if (formData.role === 'resident') {
                payload.room_number = formData.room_number;
                payload.monthly_rent = formData.monthly_rent;
            } else if (formData.role === 'security') {
                payload.salary = parseFloat(formData.salary);
            }
            console.log('Payload:', payload);
            const response = await axios.post('/api/v1/addUsers/', payload, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            console.log('Added user:', response.data);
            alert('User added successfully');
            get().resetForm();
            set({ isFormVisible: false });
            await get().fetchUsers();
        } catch (error) {
            const errorMessage = error.response?.data 
                ? JSON.stringify(error.response.data) 
                : error.message || 'Unknown error';
            console.error('Failed to add user:', errorMessage);
            alert(`Failed to add user`);
            set({ isFormVisible: true });
        }
    },


    handleEditUser: async (event) => {
        event.preventDefault();
        const { formData, editingUser } = get();
        const updatedUser = {
            username: formData.username,
            email: formData.email,
            role: formData.role
        };
        if (formData.role === 'resident') {
            updatedUser.room_number = formData.room_number;
            updatedUser.monthly_rent = formData.monthly_rent;
        } else if (formData.role === 'security') {
            updatedUser.salary = parseFloat(formData.salary);
        }
        console.log('Edit user payload:', updatedUser);
        try {
            const response = await axios.put(`/api/v1/updateUser/${editingUser.id}/`, updatedUser, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            alert('User updated successfully');
            set((state) => ({
                users: state.users.map((user) => (user.id === editingUser.id ? response.data : user)),
                filteredUsers: state.filteredUsers.map((user) => (user.id === editingUser.id ? response.data : user))
            }));
            get().resetForm();
            set({ editingUser: null, isFormVisible: false });
            await get().fetchUsers();
        } catch (error) {
            const errorMessage = error.response?.data 
                ? JSON.stringify(error.response.data) 
                : error.message || 'Unknown error';
            console.error('Failed to update user:', errorMessage);
            alert(`Failed to update user: ${errorMessage}`);
        }
    },


    handleDeleteUser: async (userId) => {
        const user = get().users.find(u => u.id === userId);
        if (!user) return;


        try {
            await axios.delete(`/api/v1/deleteUser/${userId}/`, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            alert('User deleted successfully');
            set((state) => ({
                users: state.users.filter((user) => user.id !== userId),
                filteredUsers: state.filteredUsers.filter((user) => user.id !== userId)
            }));
            await get().fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error.response?.data || error.message);
            alert('Failed to delete user');
        }
    },

    resetForm: () => set({ formData: { username: '', email: '', password: '', role: 'resident', room_number: '', monthly_rent: '',salary:'' } }),

    startEditing: (user) => {
        const roomDetails = user.room_details || { room_number: '', monthly_rent: '' };
        set({
            editingUser: user,
            formData: {
                username: user.username,
                email: user.email,
                role: user.role,
                password: '',
                room_number: roomDetails.room_number || '',
                monthly_rent: roomDetails.monthly_rent || '',
                salary: user.salary ? user.salary.toString() : ''
            },
            isFormVisible: true
        });
    },

    toggleFormVisibility: () => {
        set((state) => {
            if (state.isFormVisible) {
                return { isFormVisible: false, editingUser: null, formData: { username: '', email: '', password: '', role: 'resident', room_number: '', monthly_rent: '',salary:'' } };
            }
            return { isFormVisible: true };
        });
    },

    filterUsers: () => {
        const { users, searchTerm, roleFilter } = get();
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(
                (user) =>
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (roleFilter) {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }

        set({ filteredUsers: filtered });
    },

    roleOptions: [
        { value: 'resident', label: 'Resident' },
        { value: 'security', label: 'Security' }
    ],

    filterOptions: () => [
        { value: '', label: 'All Roles' },
        ...get().roleOptions
    ]
}));