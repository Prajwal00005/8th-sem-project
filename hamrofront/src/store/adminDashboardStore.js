import { create } from "zustand";

export const useAdminDashboardStore = create((set, get) => ({
  currentPage: "dashboard",
  stripeConnected: false,
  subscriptionPayments: [],
  subscriptionPrice: 0,
  subscriptionReminder: null,

  setCurrentPage: (page) => set({ currentPage: page }),
  setStripeConnected: (connected) => set({ stripeConnected: connected }),
  setSubscriptionPayments: (payments) =>
    set({ subscriptionPayments: payments }),
  setSubscriptionPrice: (price) => set({ subscriptionPrice: price }),
  setSubscriptionReminder: (reminder) =>
    set({ subscriptionReminder: reminder }),

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://127.0.0.1:8000/api/v1/profile/", {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      set({
        stripeConnected: data.stripe_account_active || false,
        subscriptionPrice: data.subscription_price || 0,
      });
    } catch (error) {
      console.error(error);
    }
  },

  fetchSubscriptionPayments: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/adminSubscriptionPayments/",
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      if (!response.ok)
        throw new Error("Failed to fetch subscription payments");
      const data = await response.json();
      set({ subscriptionPayments: data });
    } catch (error) {
      console.error(error);
    }
  },

  fetchSubscriptionReminder: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/checkSubscriptionDue/",
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      if (!response.ok)
        throw new Error("Failed to fetch subscription reminder");
      const data = await response.json();
      set({ subscriptionReminder: Array.isArray(data) ? data[0] : data });
    } catch (error) {
      console.error(error);
    }
  },

  handleLogout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  },

  sidebarItems: () => {
    return [
      { page: "dashboard", label: "Dashboard" },
      { page: "userManagement", label: "User Management" },
      { page: "stripeSetup", label: "Payment Settings" },
      { page: "subscriptionPayment", label: "Subscription" },
      { page: "securityPayment", label: "Security Payment" },
      { page: "reports", label: "Reports" },
      { page: "complaints", label: "Complaints" },
    ];
  },
}));
