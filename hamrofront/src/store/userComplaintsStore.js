import { create } from 'zustand';

export const useUserComplaintsStore = create((set, get) => ({
    complaints: [],
    newComplaint: { subject: '', description: '', room_number: '', complaint_type: 'resident' },
    loading: true,
    error: null,

    setComplaints: (complaints) => set({ complaints }),
    setNewComplaint: (updates) => set((state) => ({ newComplaint: { ...state.newComplaint, ...updates } })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    fetchComplaints: async () => {
        set({ loading: true });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/complaints/list/?type=resident', {
                headers: { Authorization: `Token ${token}` }
            });
            const data = await response.json();
            const residentComplaints = data.filter(complaint => 
                complaint.complaint_type === 'resident' || !complaint.complaint_type
            );
            set({ complaints: residentComplaints, loading: false, error: null });
        } catch (error) {
            set({ error: 'Failed to fetch complaints', loading: false });
        }
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        const { newComplaint } = get();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/complaints/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`
                },
                body: JSON.stringify({
                    ...newComplaint,
                    complaint_type: 'resident'
                })
            });
            
            if (response.ok) {
                set({ newComplaint: { subject: '', description: '', room_number: '', complaint_type: 'resident' } });
                get().fetchComplaints();
            } else {
                set({ error: 'Failed to submit complaint' });
            }
        } catch (error) {
            set({ error: 'Failed to submit complaint' });
        }
    },
}));