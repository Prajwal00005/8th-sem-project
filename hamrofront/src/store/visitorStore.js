import { create } from "zustand";
import axios from "../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  buildQueryParams,
  normalizePaginatedResponse,
} from "../utils/pagination";

export const useVisitorStore = create((set, get) => ({
  isFormVisible: false,
  visitorData: {
    name: "",
    address: "",
    phone_number: "",
    purpose: "",
    date: "",
    expected_time: "",
  },
  visitors: [],
  visitorHistory: [],
  visitorHistoryPagination: null,
  lastHistoryQuery: { page: 1, page_size: 10 },
  loading: false,
  error: "",
  searchTerm: "",
  historyStatusFilter: "",
  showHistory: false,

  setIsFormVisible: (visible) => set({ isFormVisible: visible }),
  setVisitorData: (updates) =>
    set((state) => ({ visitorData: { ...state.visitorData, ...updates } })),
  setVisitors: (visitors) => set({ visitors }),
  setVisitorHistory: (visitorHistory) => set({ visitorHistory }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setHistoryStatusFilter: (status) => set({ historyStatusFilter: status }),
  toggleShowHistory: () =>
    set((state) => ({ showHistory: !state.showHistory })),

  fetchVisitors: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/api/v1/visitors/", {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });
      set({ visitors: response.data, error: "" });
    } catch (error) {
      set({ error: "Failed to fetch visitors" });
    } finally {
      set({ loading: false });
    }
  },

  fetchVisitorHistory: async (params = {}) => {
    set({ loading: true });
    try {
      const { historyStatusFilter, searchTerm, lastHistoryQuery } = get();
      const query = {
        ...lastHistoryQuery,
        status: historyStatusFilter || "",
        search: searchTerm || "",
        ...params,
        paginated: true,
      };

      const response = await axios.get(
        `/api/v1/visitors/history/${buildQueryParams(query)}`,
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );

      const normalized = normalizePaginatedResponse(response.data);
      set({
        visitorHistory: normalized.results,
        visitorHistoryPagination: normalized.pagination,
        lastHistoryQuery: query,
        error: "",
      });
    } catch (error) {
      set({ error: "Failed to fetch visitor history" });
    } finally {
      set({ loading: false });
    }
  },

  handleAddVisitor: async (e) => {
    e.preventDefault();
    set({ loading: true, error: "" });
    const { visitorData } = get();

    try {
      const formattedData = {
        ...visitorData,
        date: visitorData.date,
        expected_time: visitorData.expected_time,
      };
      const response = await axios.post(
        "/api/v1/visitors/register/",
        formattedData,
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      if (response.status === 201) {
        get().fetchVisitors();
        set({
          visitorData: {
            name: "",
            address: "",
            phone_number: "",
            purpose: "",
            date: "",
            expected_time: "",
          },
          isFormVisible: false,
        });
      }
    } catch (error) {
      set({
        error: error.response?.data?.error || "Failed to register visitor",
      });
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
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      if (response.status === 200) {
        get().fetchVisitors();
        toast.success(`Visitor ${action} successfully`);
      }
    } catch (error) {
      set({ error: `Failed to ${action} visitor` });
    }
  },

  toggleFormVisibility: () => {
    set((state) => ({
      isFormVisible: !state.isFormVisible,
      visitorData: !state.isFormVisible
        ? {
            name: "",
            address: "",
            phone_number: "",
            purpose: "",
            date: "",
            expected_time: "",
          }
        : state.visitorData,
    }));
  },

  getFilteredVisitors: () => {
    const { visitors, searchTerm } = get();
    return visitors.filter(
      (visitor) =>
        (visitor.name &&
          visitor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (visitor.phone_number &&
          visitor.phone_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (visitor.unit &&
          visitor.unit.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  },

  getFilteredHistory: () => {
    const { visitorHistory } = get();
    return visitorHistory;
  },
}));
