import { create } from 'zustand';

export const useRentPaymentStore = create((set, get) => ({
  showPaymentForm: false,
  clientSecret: '',
  paymentId: null,
  paymentReminder: null,
  lastRentIncreaseDate: null,
  loading: false,
  shouldResetForm: false,
  error: '',
  paymentDetails: {
    resident_name: localStorage.getItem('username') || '',
    period_from: '',
    period_to: '',
    room_number: '',
    total_amount: 0,
  },
  paymentHistory: [],
  monthlyRent: 0,
  rentIncreased: false,
  previousRent: null,
  showPaymentReminder: true,
  showRentIncreaseReminder: false, // Initialize as false
  rentIncreaseReminder: null,

  hidePaymentReminder: () => set({ showPaymentReminder: false }),
  hideRentIncreaseReminder: () => set({ showRentIncreaseReminder: false }),
  setClientSecret: (secret) => set({ clientSecret: secret }),
  setPaymentId: (id) => set({ paymentId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setShouldResetForm: (value) => set({ shouldResetForm: value }),
  setPaymentDetails: (updates) => set((state) => ({paymentDetails: {
    ...state.paymentDetails,
    ...updates,
  } })),
  setPaymentHistory: (history) => set({ paymentHistory: history }),
  setMonthlyRent: (rent) => set({ monthlyRent: rent }),
  setRentIncreaseInfo: (increased, previousRent, lastIncreaseDate) => set({ 
    rentIncreased: increased, 
    previousRent: previousRent,
    lastRentIncreaseDate: lastIncreaseDate 
  }),
  setShowPaymentForm: (visible) => set(state => ({ 
    showPaymentForm: visible,
    ...(visible ? {} : {
      clientSecret: '',
      paymentId: null,
      error: '',
      shouldResetForm: false,
      paymentDetails: state.shouldResetForm ? {
        resident_name: localStorage.getItem('username') || '',
        period_from: '',
        period_to: '',
        room_number: state.paymentDetails.room_number,
        total_amount: 0,
      } : state.paymentDetails
    })
  })),
  
  checkRentIncrease: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/check-rent-increase/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.rent_increased) {
        set({ 
          rentIncreaseReminder: data.reminder || `Your rent has increased by 5% from ₹${data.previous_rent} to ₹${data.current_rent}`,
          lastRentIncreaseDate: data.last_increase_date,
          monthlyRent: parseFloat(data.current_rent),
          rentIncreased: true,
          previousRent: parseFloat(data.previous_rent),
          showRentIncreaseReminder: true,
        });
      } else {
        set({ 
          monthlyRent: parseFloat(data.current_rent),
          rentIncreased: false,
          rentIncreaseReminder: data.reminder || null,
          previousRent: null,
          lastRentIncreaseDate: data.last_increase_date,
          showRentIncreaseReminder: !!data.reminder,
        });
      }
    } catch (error) {
      console.error('Failed to check rent increase:', error);
      set({ error: 'Failed to check rent increase' });
    }
  },

  updatePeriodTo: () => {
    const { paymentDetails } = get();
    if (!paymentDetails.period_from){ return;}

    const fromDate = new Date(paymentDetails.period_from);
    if (isNaN(fromDate.getTime())) {
      return;
    }
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 29);
    set({
      paymentDetails: {
        ...paymentDetails,
        period_to: toDate.toISOString().split('T')[0]
      }
    });
  },

  fetchRoomDetails: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/rooms/mine/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      set({ 
        monthlyRent: parseFloat(data.monthly_rent), // Ensure it's a number
        paymentDetails: { 
          ...get().paymentDetails, 
          room_number: data.room_number,
          resident_name: localStorage.getItem('username') || ''
        },
        loading: false 
      });
    } catch (err) {
      console.error('Failed to fetch room details:', err);
      set({ error: 'Failed to fetch room details', loading: false });
    }
  },

  fetchPaymentHistory: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/residentPayments/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payment history');
      const data = await response.json();
      console.log('Payment History Response:', data);
      set({ paymentHistory: data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch payment history', loading: false });
    }
  },

  fetchPaymentReminder: async () => {
    set({ loading: true, error: '' });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/checkPaymentDue/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payment reminder');
      const data = await response.json();
      console.log('Payment Reminder:', data);
      set({ paymentReminder: data,monthlyRent: data.monthly_rent || get().monthlyRent, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch payment reminder', loading: false });
    }
  },

  handleSubmit: async (e) => {
    e.preventDefault();
    set({ loading: true, error: '' });
    const { paymentDetails, monthlyRent, paymentHistory } = get();
  
    const fromDate = new Date(paymentDetails.period_from);
    const toDate = new Date(paymentDetails.period_to);
    const daysCovered = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    const monthsCovered = Math.max(1, Math.round(daysCovered / 30));
    const totalAmount = monthlyRent * monthsCovered;
  
    // Check for overlapping dates
    const hasOverlap = paymentHistory.some(payment => {
      const existingFrom = new Date(payment.period_from);
      const existingTo = new Date(payment.period_to);
      return (fromDate <= existingTo && toDate >= existingFrom);
    });
  
    if (hasOverlap) {
      set({ 
        error: 'Error: The selected period overlaps with an existing payment. Please choose other dates.', 
        loading: false 
      });
      return;
    }
  
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/createPaymentIntent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          period_from: paymentDetails.period_from,
          period_to: paymentDetails.period_to,
          room_number: paymentDetails.room_number,
          amount: totalAmount,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        if (response.ok) {
          console.log('Updating paymentDetails:', {
            ...paymentDetails,
            total_amount: totalAmount,
            period_from: paymentDetails.period_from,
            period_to: paymentDetails.period_to
          });
          set({
            clientSecret: data.clientSecret,
            paymentId: data.payment_id,
            showPaymentForm: true,
            shouldResetForm: data.shouldResetForm || false, 
            paymentDetails: {
              ...paymentDetails,
              total_amount: totalAmount,
              period_from: paymentDetails.period_from,
              period_to: paymentDetails.period_to
            }
          });
      } else {
        const suggestedTo = data.suggested_period_to;
        if (suggestedTo) {
          set({
            error: data.error,
            paymentDetails: { ...paymentDetails, period_to: suggestedTo }
          });
        } else {
          console.log('Error response:', data);
          set({ error: data.error || 'Something went wrong. Please try again.',
            loading: false,
            paymentDetails: {
                resident_name: localStorage.getItem('username') || '',
                period_from: '',
                period_to: '',
                room_number: get().paymentDetails.room_number,
                total_amount: 0,
            }
           });
          }
        }}
    } catch (err) {
      set({ error: 'Network error. Please check your connection and try again.',
        loading: false,
        paymentDetails: {
            resident_name: localStorage.getItem('username') || '',
            period_from: '',
            period_to: '',
            room_number: get().paymentDetails.room_number,
            total_amount: 0,
        }
       });
    } finally {
      set({ loading: false });
    }
  },

  confirmPayment: async (paymentIntentId) => {
    set({ loading: true, error: '' });
    const { paymentId, fetchPaymentHistory } = get();
    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'You are not logged in. Please log in and try again.', loading: false,
        paymentDetails: {
          resident_name: localStorage.getItem('username') || '',
          period_from: '',
          period_to: '',
          room_number: get().paymentDetails.room_number,
          total_amount: 0,
        },
        shouldResetForm: false
    });
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/confirmPayment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          payment_intent_id: paymentIntentId
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment confirmation failed');
      }
  
      if (response.headers.get('content-type') === 'application/pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'invoice.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await fetchPaymentHistory();
        set({ error: '', showPaymentForm: false });
      } else {
        const data = await response.json();
        set({ paymentHistory: [data, ...get().paymentHistory], loading: false });
        await fetchPaymentHistory();
        set({ 
          showPaymentForm: false,
          clientSecret: '',
          paymentId: null,
          error: '',
          paymentDetails:{
            resident_name: localStorage.getItem('username') || '',
            period_from: '',
            period_to: '',
            room_number: get().paymentDetails.room_number,
            total_amount: 0,
          }
        });
      }
    } catch (err) {
      set({ 
        error: err.message, 
        loading: false,
        showPaymentForm: false,
        clientSecret: '',
        paymentId: null,
        paymentDetails: {
          resident_name: localStorage.getItem('username') || '',
          period_from: '',
          period_to: '',
          room_number: get().paymentDetails.room_number,
          total_amount: 0,
        }
      });
    } finally {
      set({ 
        loading: false, 
        showPaymentForm: false,
        clientSecret: '',
        paymentId: null,
        paymentDetails: {
          resident_name: localStorage.getItem('username') || '',
          period_from: '',
          period_to: '',
          room_number: get().paymentDetails.room_number,
          total_amount: 0,
        }
      });
    }
  },
  }));
