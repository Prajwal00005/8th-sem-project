import { create } from "zustand";
import api from "../utils/axiosConfig";

export const useResidentBillStore = create((set, get) => ({
  bills: [],
  selectedBill: null,
  loading: false,
  error: "",
  showPaymentForm: false,
  clientSecret: "",
  payingBill: null,

  fetchBills: async () => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get("/api/v1/bills/resident/");
      set({ bills: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch bills", err);
      set({ error: "Failed to fetch bills", loading: false });
    }
  },

  fetchBillDetail: async (billId) => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get(`/api/v1/bills/resident/${billId}/`);
      set({ selectedBill: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch bill detail", err);
      set({ error: "Failed to fetch bill detail", loading: false });
    }
  },

  clearSelectedBill: () => set({ selectedBill: null }),

  openBillPaymentForm: async (bill) => {
    set({ loading: true, error: "" });
    try {
      const res = await api.post(
        `/api/v1/bills/resident/${bill.id}/create-payment-intent/`,
      );
      set({
        clientSecret: res.data.clientSecret,
        showPaymentForm: true,
        payingBill: bill,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to create payment intent for bill", err);
      set({
        error: "Failed to start payment. Please try again.",
        loading: false,
      });
    }
  },

  closeBillPaymentForm: () =>
    set({ showPaymentForm: false, clientSecret: "", payingBill: null }),

  confirmBillPayment: async (paymentIntentId) => {
    const { payingBill } = get();
    if (!payingBill) return;

    set({ loading: true, error: "" });
    try {
      const res = await api.post("/api/v1/bills/resident/confirm-payment/", {
        bill_id: payingBill.id,
        payment_intent_id: paymentIntentId,
      });

      await get().fetchBills();

      set({
        loading: false,
        showPaymentForm: false,
        clientSecret: "",
        payingBill: null,
      });

      return res.data;
    } catch (err) {
      console.error("Failed to confirm bill payment", err);
      set({
        error: "Failed to confirm payment. Please try again.",
        loading: false,
      });
      throw err;
    }
  },
}));
