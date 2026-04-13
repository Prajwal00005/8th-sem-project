import { create } from "zustand";
import api from "../utils/axiosConfig";

export const useAdminBillStore = create((set, get) => ({
  aggregateBills: [],
  loading: false,
  error: "",

  setError: (error) => set({ error }),

  fetchAggregateBills: async () => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get("/api/v1/bills/admin/aggregate/");
      set({ aggregateBills: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch admin aggregate bills", err);
      set({ error: "Failed to fetch bills", loading: false });
    }
  },

  updateAggregateBillStatus: async (billId, status) => {
    set({ loading: true, error: "" });
    try {
      await api.patch(`/api/v1/bills/admin/aggregate/${billId}/status/`, {
        payment_status: status,
      });
      await get().fetchAggregateBills();
      set({ loading: false });
    } catch (err) {
      console.error("Failed to update aggregate bill status", err);
      set({ error: "Failed to update bill status", loading: false });
    }
  },
}));
