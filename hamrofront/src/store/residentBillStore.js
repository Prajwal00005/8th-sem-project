import { create } from 'zustand';
import api from '../utils/axiosConfig';

export const useResidentBillStore = create((set) => ({
  bills: [],
  selectedBill: null,
  loading: false,
  error: '',

  fetchBills: async () => {
    set({ loading: true, error: '' });
    try {
      const res = await api.get('/api/v1/bills/resident/');
      set({ bills: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch bills', err);
      set({ error: 'Failed to fetch bills', loading: false });
    }
  },

  fetchBillDetail: async (billId) => {
    set({ loading: true, error: '' });
    try {
      const res = await api.get(`/api/v1/bills/resident/${billId}/`);
      set({ selectedBill: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch bill detail', err);
      set({ error: 'Failed to fetch bill detail', loading: false });
    }
  },

  clearSelectedBill: () => set({ selectedBill: null }),
}));
