import { create } from 'zustand';

export const useSuperadminStripeSetupStore = create((set, get) => ({
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
    localStorage.setItem('stripe_connected_superadmin', connected);
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

      const response = await fetch('http://127.0.0.1:8000/api/v1/stripe/connect/complete/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('');

      const data = await response.json();
      set({
        isConnected: data.active || false,
        accountId: data.account_id || null,
        initialized: true,
      });

      if (data.active) {
        await get().fetchPaymentHistory();
      }
    } catch (err) {
      set({ error: err.message });
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

      const response = await fetch('http://127.0.0.1:8000/api/v1/stripe/connect/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start Stripe connection');
      }

      const data = await response.json();
      if (data.url) {
        localStorage.setItem('returnToDashboard', 'true');
        window.location.href = data.url;
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
      const response = await fetch('http://127.0.0.1:8000/api/v1/adminSubscriptionPayments/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payment history');
      const data = await response.json();
      set({ paymentHistory: data });
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
    return paymentHistory.filter((payment) => {
      const username = payment.admin?.username || payment.admin_username || '';
      return (
        username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.subscription_year.toString().includes(searchTerm)
      );
    });
  },
}));