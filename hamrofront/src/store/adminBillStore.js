import { create } from "zustand";
import api from "../utils/axiosConfig";
import {
  buildQueryParams,
  normalizePaginatedResponse,
} from "../utils/pagination";

export const useAdminBillStore = create((set, get) => ({
  aggregateBills: [],
  aggregatePagination: null,
  lastAggregateQuery: { page: 1, page_size: 10 },
  loading: false,
  error: "",

  setError: (error) => set({ error }),

  fetchAggregateBills: async (params = {}) => {
    set({ loading: true, error: "" });
    try {
      const query = {
        ...get().lastAggregateQuery,
        ...params,
        paginated: true,
      };
      const res = await api.get(
        `/api/v1/bills/admin/aggregate/${buildQueryParams(query)}`,
      );
      const normalized = normalizePaginatedResponse(res.data);
      set({
        aggregateBills: normalized.results,
        aggregatePagination: normalized.pagination,
        lastAggregateQuery: query,
        loading: false,
      });
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
      await get().fetchAggregateBills(get().lastAggregateQuery);
      set({ loading: false });
    } catch (err) {
      console.error("Failed to update aggregate bill status", err);
      set({ error: "Failed to update bill status", loading: false });
    }
  },
}));
