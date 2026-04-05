import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useGuardDashboardStore = create((set, get) => ({
    currentPage: 'dashboard',
    visitors: [],
    loading: false,
    error: '',
    searchTerm: '',
    paymentHistory: [],
    paymentReminder: null,
    stripeConnected: false,
    salaryInfo: null,

    setSalaryInfo: (info) => set({ salaryInfo: info }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setVisitors: (visitors) => set({ visitors }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setPaymentHistory: (history) => set({ paymentHistory: history }),
    setPaymentReminder: (reminder) => set({ paymentReminder: reminder }),
    setStripeConnected: (connected) => set({ stripeConnected: connected }),


    fetchVisitors: async () => {
        set({ loading: true });
        try {
            const response = await axios.get('/api/v1/visitors/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ visitors: response.data, error: '' });
        } catch (error) {
            console.error(error);
            set({ error: 'Failed to fetch visitors' });
        } finally {
            set({ loading: false });
        }
    },

    handleVisitorAction: async (visitorId, action) => {
        try {
            const response = await axios.put(
                `/api/v1/visitors/${visitorId}/status/`,
                { status: action },
                {
                    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
                }
            );
            if (response.status === 200) {
                get().fetchVisitors();
                alert(`Visitor ${action} successfully`);
            }
        } catch (error) {
            console.error(error);
            set({ error: `Failed to ${action} visitor` });
        }
    },

    fetchSalaryInfo: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/check_salary_increase/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ salaryInfo: response.data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch salary info', loading: false });
        }
    },

    fetchPaymentHistory: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/securityPayments/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ paymentHistory: response.data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch payment history', loading: false });
        }
    },

    fetchPaymentReminder: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/checkSecurityPaymentDue/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ 
                paymentReminder: Array.isArray(response.data) ? response.data[0] : response.data, 
                loading: false 
            });
        } catch (error) {
            set({ error: 'Failed to fetch payment reminder', loading: false });
        }
    },

    handleLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    },

    getFilteredVisitors: () => {
        const { visitors, searchTerm } = get();
        return visitors.filter(visitor =>
            (visitor.name && visitor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (visitor.unit && visitor.unit.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    },
}));