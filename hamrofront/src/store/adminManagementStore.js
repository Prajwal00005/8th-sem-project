import { create } from "zustand";
import axios from "../utils/axiosConfig";
import { toast } from "react-toastify";

let adminListRequestSeq = 0;

export const useSadminManagementStore = create((set, get) => ({
  admins: [],
  filteredAdmins: [],
  reportAdmins: [],
  reportStats: {
    totalAdmins: 0,
    subscribedCount: 0,
    unpaidCount: 0,
    totalAmount: 0,
    collectedAmount: 0,
    outstandingAmount: 0,
  },
  isLoadingAdmins: false,
  isLoadingReports: false,
  adminPagination: {
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  reportPagination: {
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  reportFilters: {
    status: "all",
    dateFrom: "",
    dateTo: "",
  },
  formData: {
    username: "",
    email: "",
    password: "",
    apartmentName: "",
    subscription_price: "",
  },
  editingAdmin: null,
  isFormVisible: false,
  searchTerm: "",

  setAdmins: (admins) => set({ admins, filteredAdmins: admins }),
  setFormData: (updates) =>
    set((state) => ({ formData: { ...state.formData, ...updates } })),
  setEditingAdmin: (admin) => set({ editingAdmin: admin }),
  setIsFormVisible: (visible) => set({ isFormVisible: visible }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setAdminPage: (page) =>
    set((state) => ({
      adminPagination: { ...state.adminPagination, page: Math.max(1, page) },
    })),
  setAdminPageSize: (pageSize) =>
    set((state) => ({
      adminPagination: {
        ...state.adminPagination,
        pageSize,
        page: 1,
      },
    })),
  setReportPage: (page) =>
    set((state) => ({
      reportPagination: { ...state.reportPagination, page: Math.max(1, page) },
    })),
  setReportPageSize: (pageSize) =>
    set((state) => ({
      reportPagination: {
        ...state.reportPagination,
        pageSize,
        page: 1,
      },
    })),
  setReportFilters: (updates) =>
    set((state) => ({
      reportFilters: { ...state.reportFilters, ...updates },
    })),

  fetchAdmins: async ({ page, pageSize, search } = {}) => {
    const requestSeq = ++adminListRequestSeq;
    try {
      const state = get();
      const nextPage = page ?? state.adminPagination.page;
      const nextPageSize = pageSize ?? state.adminPagination.pageSize;
      const nextSearch = search ?? state.searchTerm;

      set({ isLoadingAdmins: true });

      const params = {
        page: nextPage,
        page_size: nextPageSize,
      };

      if (nextSearch) {
        params.search = nextSearch;
      }

      const response = await axios.get("/api/v1/adminList/", {
        params,
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });

      if (requestSeq !== adminListRequestSeq) {
        return;
      }

      const results = response.data?.results || [];
      const pagination = response.data?.pagination || {};

      set({
        admins: results,
        filteredAdmins: results,
        adminPagination: {
          page: pagination.page ?? nextPage,
          pageSize: pagination.page_size ?? nextPageSize,
          total: pagination.total ?? results.length,
          totalPages: pagination.total_pages ?? 1,
          hasNext: pagination.has_next ?? false,
          hasPrevious: pagination.has_previous ?? false,
        },
      });
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      if (requestSeq === adminListRequestSeq) {
        set({ isLoadingAdmins: false });
      }
    }
  },

  fetchReportAdmins: async ({
    page,
    pageSize,
    status,
    dateFrom,
    dateTo,
  } = {}) => {
    try {
      const state = get();
      const nextPage = page ?? state.reportPagination.page;
      const nextPageSize = pageSize ?? state.reportPagination.pageSize;
      const nextStatus = status ?? state.reportFilters.status;
      const nextDateFrom = dateFrom ?? state.reportFilters.dateFrom;
      const nextDateTo = dateTo ?? state.reportFilters.dateTo;

      set({ isLoadingReports: true });

      const params = {
        page: nextPage,
        page_size: nextPageSize,
      };

      if (nextStatus && nextStatus !== "all") {
        params.status = nextStatus;
      }
      if (nextDateFrom) {
        params.date_from = nextDateFrom;
      }
      if (nextDateTo) {
        params.date_to = nextDateTo;
      }

      const response = await axios.get("/api/v1/adminList/", {
        params,
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });

      const results = response.data?.results || [];
      const pagination = response.data?.pagination || {};
      const stats = response.data?.stats || {};

      set({
        reportAdmins: results,
        reportPagination: {
          page: pagination.page ?? nextPage,
          pageSize: pagination.page_size ?? nextPageSize,
          total: pagination.total ?? results.length,
          totalPages: pagination.total_pages ?? 1,
          hasNext: pagination.has_next ?? false,
          hasPrevious: pagination.has_previous ?? false,
        },
        reportStats: {
          totalAdmins: stats.total_admins ?? 0,
          subscribedCount: stats.subscribed_count ?? 0,
          unpaidCount: stats.unpaid_count ?? 0,
          totalAmount: stats.total_amount ?? 0,
          collectedAmount: stats.collected_amount ?? 0,
          outstandingAmount: stats.outstanding_amount ?? 0,
        },
        reportFilters: {
          status: nextStatus,
          dateFrom: nextDateFrom,
          dateTo: nextDateTo,
        },
      });
    } catch (error) {
      console.error("Failed to fetch report admins:", error);
    } finally {
      set({ isLoadingReports: false });
    }
  },

  handleAddAdmin: async (event) => {
    event.preventDefault();
    const { formData } = get();
    const subscriptionPrice = parseFloat(formData.subscription_price);
    if (isNaN(subscriptionPrice) || subscriptionPrice <= 0) {
      toast.error("Please enter a valid subscription price greater than 0.");
      return;
    }
    try {
      const response = await axios.post(
        "/api/v1/addAdmin/",
        { ...formData, subscription_price: subscriptionPrice },
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Admin added successfully");
      await get().fetchAdmins({ page: 1 });
      get().resetForm();
      set({ isFormVisible: false });
    } catch (error) {
      console.error(
        "Failed to add admin:",
        error.response?.data || error.message,
      );
      toast.error("Failed to add admin");
    }
  },

  handleEditAdmin: async (event) => {
    event.preventDefault();
    const { formData, editingAdmin } = get();
    const subscriptionPrice = parseFloat(formData.subscription_price);
    if (isNaN(subscriptionPrice) || subscriptionPrice <= 0) {
      toast.error("Please enter a valid subscription price greater than 0.");
      return;
    }
    const updatedAdmin = {
      username: formData.username,
      email: formData.email,
      apartmentName: formData.apartmentName,
      subscription_price: subscriptionPrice,
    };
    try {
      const response = await axios.put(
        `/api/v1/updateAdmin/${editingAdmin.id}/`,
        updatedAdmin,
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Admin updated successfully");
      await get().fetchAdmins(); // Refresh admin list
      get().resetForm();
      get().resetForm();
      set({ editingAdmin: null, isFormVisible: false });
    } catch (error) {
      console.error(
        "Failed to update admin:",
        error.response?.data || error.message,
      );
      toast.error("Failed to update admin");
    }
  },

  handleDeleteAdmin: async (adminId, onConfirm) => {
    const admin = get().admins.find((a) => a.id === adminId);
    if (!admin) return;

    const confirmed = await onConfirm(admin);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/v1/deleteAdmin/${adminId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });
      toast.success("Admin deleted successfully");
      await get().fetchAdmins();
    } catch (error) {
      console.error(
        "Failed to delete admin:",
        error.response?.data || error.message,
      );
      toast.error("Failed to delete admin");
    }
  },

  toggleAdminAccess: async (adminId, isActive) => {
    try {
      await axios.post(
        `/api/v1/admins/${adminId}/toggleAccess/`,
        { is_active: isActive },
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      await get().fetchAdmins();
    } catch (error) {
      console.error(
        "Failed to toggle admin access:",
        error.response?.data || error.message,
      );
      toast.error("Failed to update admin access");
    }
  },

  recordCashSubscription: async (adminId) => {
    const { admins } = get();
    const admin = admins.find((a) => a.id === adminId);
    if (!admin) return;

    const price = parseFloat(admin.subscription_price);
    if (isNaN(price) || price <= 0) {
      toast.error("Set a valid subscription price before manual payment.");
      return;
    }

    try {
      await axios.post(
        `/api/v1/admins/${adminId}/cashSubscription/`,
        { amount: price },
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Manual 1-year subscription recorded");
      await get().fetchAdmins();
    } catch (error) {
      console.error(
        "Failed to record manual subscription:",
        error.response?.data || error.message,
      );
      toast.error("Failed to record manual subscription");
    }
  },

  resetForm: () =>
    set({
      formData: {
        username: "",
        email: "",
        password: "",
        apartmentName: "",
        subscription_price: "",
      },
    }),

  startEditing: (admin) => {
    set({
      editingAdmin: admin,
      formData: {
        username: admin.username,
        email: admin.email,
        apartmentName: admin.apartmentName,
        password: "",
        subscription_price: admin.subscription_price
          ? admin.subscription_price.toString()
          : "",
      },
      isFormVisible: true,
    });
  },

  toggleFormVisibility: () => {
    set((state) => {
      if (state.isFormVisible) {
        return {
          isFormVisible: false,
          editingAdmin: null,
          formData: {
            username: "",
            email: "",
            password: "",
            apartmentName: "",
            subscription_price: "",
          },
        };
      }
      return { isFormVisible: true };
    });
  },

  filterAdmins: () => {
    // Search filtering is now handled by the backend.
    return;
  },
}));
