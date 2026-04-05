import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useSecurityPaymentStore = create((set, get) => ({
    securityPayments: [],
    securityPrice: 0,
    securityReminder: null,
    loading: false,
    error: '',
    securityUsers: [],

    setSecurityPayments: (payments) => set({ securityPayments: payments }),
    setSecurityPrice: (price) => set({ securityPrice: price }),
    setSecurityReminder: (reminder) => set({ securityReminder: reminder }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setSecurityUsers: (users) => set({ securityUsers: users }),

    fetchSecurityPayments: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/securityPayments/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ securityPayments: response.data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch security payments', loading: false });
        }
    },

    fetchSecurityReminder: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/checkSecurityPaymentDue/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            set({ 
                securityReminder: Array.isArray(response.data) ? response.data : [response.data], 
                loading: false 
            });
        } catch (error) {
            set({ error: 'Failed to fetch security reminder', loading: false });
        }
    },

    fetchSecurityUsers: async () => {
        set({ loading: true, error: '' });
        try {
            const response = await axios.get('/api/v1/userList/', {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            });
            const securityUsers = response.data.filter(user => user.role === 'security');
            set({ securityUsers, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch security users', loading: false });
        }
    },
}));