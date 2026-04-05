import { create } from 'zustand';
import axios from '../utils/axiosConfig';

export const useSecurityStripeSetupStore = create((set, get) => ({
  loading: true,
  error: '',
  isConnected: false,
  accountId: null,
  paymentHistory: [],
  searchTerm: '',
  initialized: false,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsConnected: (connected) => {
    set({ isConnected: connected });
    localStorage.setItem('stripe_connected_security', connected);
  },
  setAccountId: (id) => set({ accountId: id }),
  setPaymentHistory: (history) => set({ paymentHistory: history }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setInitialized: (value) => set({ initialized: value }),

  checkStripeStatus: async () => {
    if (get().initialized) return;

    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get('/api/v1/stripe/connect/complete/', {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      set({
        isConnected: response.data.active || false,
        accountId: response.data.account_id || null,
        initialized: true,
        loading: false,
        error: null,
      });

      if (response.data.active) {
        await get().fetchPaymentHistory();
      }
    } catch (err) {
      set({ error: null,
        loading: false,
        initialized: true, });
      if (err.message.includes('session has expired') || err.message.includes('authentication')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      set({ loading: false });
    }
  },

  handleStripeConnect: async () => {
    set({ loading: true, error: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get('/api/v1/stripe/connect/', {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.error || 'Failed to start Stripe connection');
      }

      if (response.data.url) {
        localStorage.setItem('returnToDashboard', 'true');
        window.location.href = response.data.url;
      } else {
        throw new Error('No redirect URL received from server');
      }
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPaymentHistory: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await axios.get('/api/v1/securityPayments/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      set({ paymentHistory: response.data });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch payment history' });
      if (err.message.includes('authentication')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      set({ loading: false });
    }
  },

  getFilteredHistory: () => {
    const { paymentHistory, searchTerm } = get();
    if (!searchTerm) return paymentHistory;
    return paymentHistory.filter(
      (payment) =>
        payment.admin_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_year.toString().includes(searchTerm)
    );
  },
}));