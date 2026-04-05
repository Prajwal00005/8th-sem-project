import { create } from 'zustand';

export const useSuperadminDashboardStore = create((set, get) => ({
    currentPage: 'dashboard',
    subscriptionReminders: [],

    setCurrentPage: (page) => set({ currentPage: page }),
    setSubscriptionReminders: (reminders) => set({ subscriptionReminders: reminders }),

    fetchSubscriptionReminders: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/checkSubscriptionDue/', {
                headers: { Authorization: `Token ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch subscription reminders');
            const data = await response.json();
            set({ subscriptionReminders: Array.isArray(data) ? data : [data] });
        } catch (error) {
            console.error(error);
        }
    },

    
    handleLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    },

    sidebarItems: [
        { page: 'dashboard', label: 'Dashboard' },
        { page: 'sadminManagement', label: 'Admin Management' },
        { page: 'stripeSetup', label: 'Payment Settings' },
        { page: 'SAComplaints', label: 'Complaints' },
        { page: 'blogManagement', label: 'Blog Management' }
    ],
}));