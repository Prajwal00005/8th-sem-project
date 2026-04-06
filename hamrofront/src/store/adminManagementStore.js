import { create } from "zustand";
import axios from "../utils/axiosConfig";
import { toast } from "react-toastify";

export const useSadminManagementStore = create((set, get) => ({
  admins: [],
  filteredAdmins: [],
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

  fetchAdmins: async () => {
    try {
      const response = await axios.get("/api/v1/adminList/", {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });
      set({ admins: response.data, filteredAdmins: response.data });
    } catch (error) {
      console.error("Failed to fetch admins:", error);
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
      set((state) => ({
        admins: [...state.admins, response.data],
        filteredAdmins: [...state.admins, response.data],
      }));
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
      set((state) => ({
        admins: state.admins.map((admin) =>
          admin.id === editingAdmin.id ? response.data : admin,
        ),
        filteredAdmins: state.admins.map((admin) =>
          admin.id === editingAdmin.id ? response.data : admin,
        ),
      }));
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
      set((state) => ({
        admins: state.admins.filter((admin) => admin.id !== adminId),
        filteredAdmins: state.filteredAdmins.filter(
          (admin) => admin.id !== adminId,
        ),
      }));
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
    const { admins, searchTerm } = get();
    let filtered = admins;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((admin) => {
        const username = (admin.username || "").toLowerCase();
        const email = (admin.email || "").toLowerCase();
        const apartment = (admin.apartmentName || "").toLowerCase();
        return (
          username.includes(term) ||
          email.includes(term) ||
          apartment.includes(term)
        );
      });
    }

    set({ filteredAdmins: filtered });
  },
}));
