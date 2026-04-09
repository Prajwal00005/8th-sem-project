import { create } from "zustand";
import api from "../utils/axiosConfig";

export const useSecurityBillStore = create((set, get) => ({
  rooms: [],
  bills: [],
  aggregateBills: [],
  loading: false,
  error: "",
  editingBill: null,
  billForm: {
    room: "",
    date: "",
    payment_status: "unpaid",
    items: [{ name: "", units: "", rate_per_unit: "", amount: "" }],
  },

  aggregateBillForm: {
    date: "",
    items: [{ name: "", units: "", rate_per_unit: "", amount: "" }],
  },

  setError: (error) => set({ error }),

  setBillForm: (updates) =>
    set((state) => ({ billForm: { ...state.billForm, ...updates } })),

  setAggregateBillForm: (updates) =>
    set((state) => ({
      aggregateBillForm: { ...state.aggregateBillForm, ...updates },
    })),

  resetBillForm: () =>
    set({
      editingBill: null,
      billForm: {
        room: "",
        date: "",
        payment_status: "unpaid",
        items: [{ name: "", units: "", rate_per_unit: "", amount: "" }],
      },
      aggregateBillForm: {
        date: "",
        items: [{ name: "", units: "", rate_per_unit: "", amount: "" }],
      },
    }),

  addItemRow: () =>
    set((state) => ({
      billForm: {
        ...state.billForm,
        items: [
          ...state.billForm.items,
          { name: "", units: "", rate_per_unit: "", amount: "" },
        ],
      },
    })),

  addAggregateItemRow: () =>
    set((state) => ({
      aggregateBillForm: {
        ...state.aggregateBillForm,
        items: [
          ...state.aggregateBillForm.items,
          { name: "", units: "", rate_per_unit: "", amount: "" },
        ],
      },
    })),

  updateItemRow: (index, updates) =>
    set((state) => {
      const items = [...state.billForm.items];
      items[index] = { ...items[index], ...updates };
      // Auto-calc amount when units and rate_per_unit both provided
      const units = items[index].units;
      const rate = items[index].rate_per_unit;
      if (units !== "" && rate !== "" && !updates.hasOwnProperty("amount")) {
        const u = parseFloat(units);
        const r = parseFloat(rate);
        if (!isNaN(u) && !isNaN(r)) {
          items[index].amount = (u * r).toFixed(2);
        }
      }
      return { billForm: { ...state.billForm, items } };
    }),

  updateAggregateItemRow: (index, updates) =>
    set((state) => {
      const items = [...state.aggregateBillForm.items];
      items[index] = { ...items[index], ...updates };
      const units = items[index].units;
      const rate = items[index].rate_per_unit;
      if (units !== "" && rate !== "" && !updates.hasOwnProperty("amount")) {
        const u = parseFloat(units);
        const r = parseFloat(rate);
        if (!isNaN(u) && !isNaN(r)) {
          items[index].amount = (u * r).toFixed(2);
        }
      }
      return { aggregateBillForm: { ...state.aggregateBillForm, items } };
    }),

  removeItemRow: (index) =>
    set((state) => ({
      billForm: {
        ...state.billForm,
        items: state.billForm.items.filter((_, i) => i !== index),
      },
    })),

  removeAggregateItemRow: (index) =>
    set((state) => ({
      aggregateBillForm: {
        ...state.aggregateBillForm,
        items: state.aggregateBillForm.items.filter((_, i) => i !== index),
      },
    })),

  fetchRooms: async () => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get("/api/v1/rooms/apartment/");
      set({ rooms: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch rooms", err);
      set({ error: "Failed to fetch rooms", loading: false });
    }
  },

  fetchBills: async () => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get("/api/v1/bills/security/");
      set({ bills: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch bills", err);
      set({ error: "Failed to fetch bills", loading: false });
    }
  },

  fetchAggregateBills: async () => {
    set({ loading: true, error: "" });
    try {
      const res = await api.get("/api/v1/bills/security/aggregate/");
      set({ aggregateBills: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch aggregate bills", err);
      set({ error: "Failed to fetch aggregate bills", loading: false });
    }
  },

  saveBill: async () => {
    const { billForm, editingBill } = get();
    set({ loading: true, error: "" });

    try {
      const items = billForm.items
        .filter((i) => i.name)
        .map((i) => ({
          name: i.name,
          units: i.units === "" ? null : parseFloat(i.units),
          rate_per_unit:
            i.rate_per_unit === "" ? null : parseFloat(i.rate_per_unit),
          amount:
            i.amount === "" || i.amount == null ? null : parseFloat(i.amount),
        }));

      const total_amount = items.reduce(
        (sum, i) => (i.amount != null ? sum + i.amount : sum),
        0,
      );

      const payload = {
        room: billForm.room,
        date: billForm.date,
        payment_status: billForm.payment_status || "unpaid",
        total_amount,
        items,
      };

      if (editingBill) {
        await api.put(`/api/v1/bills/security/${editingBill.id}/`, payload);
      } else {
        await api.post("/api/v1/bills/security/", payload);
      }

      await get().fetchBills();
      get().resetBillForm();
      set({ loading: false });
      return true;
    } catch (err) {
      console.error("Failed to save bill", err);
      set({ error: "Failed to save bill", loading: false });
      return false;
    }
  },

  saveAggregateBill: async () => {
    const { aggregateBillForm } = get();
    set({ loading: true, error: "" });

    try {
      const items = aggregateBillForm.items
        .filter((i) => i.name)
        .map((i) => ({
          name: i.name,
          units: i.units === "" ? null : parseFloat(i.units),
          rate_per_unit:
            i.rate_per_unit === "" ? null : parseFloat(i.rate_per_unit),
          amount:
            i.amount === "" || i.amount == null ? null : parseFloat(i.amount),
        }));

      const total_amount = items.reduce(
        (sum, i) => (i.amount != null ? sum + i.amount : sum),
        0,
      );

      const payload = {
        date: aggregateBillForm.date,
        total_amount,
        items,
      };

      await api.post("/api/v1/bills/security/aggregate/", payload);

      await get().fetchAggregateBills();
      get().resetBillForm();
      set({ loading: false });
      return true;
    } catch (err) {
      console.error("Failed to save aggregate bill", err);
      set({ error: "Failed to save aggregate bill", loading: false });
      return false;
    }
  },

  startEditBill: (bill) => {
    set({
      editingBill: bill,
      billForm: {
        room: bill.room,
        date: bill.date,
        payment_status: bill.payment_status || "unpaid",
        items: bill.items.map((i) => ({
          name: i.name,
          units: i.units ?? "",
          rate_per_unit: i.rate_per_unit ?? "",
          amount: i.amount ?? "",
        })),
      },
    });
  },

  deleteBill: async (billId) => {
    set({ loading: true, error: "" });
    try {
      await api.delete(`/api/v1/bills/security/${billId}/`);
      await get().fetchBills();
      set({ loading: false });
    } catch (err) {
      console.error("Failed to delete bill", err);
      set({ error: "Failed to delete bill", loading: false });
    }
  },
}));
