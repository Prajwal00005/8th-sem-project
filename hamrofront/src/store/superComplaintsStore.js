import { create } from 'zustand';

export const useSAComplaintsStore = create((set, get) => ({
    complaints: [],
    newComplaint: { subject: '', description: '', complaint_type: 'admin' },
    loading: true,
    error: null,
    userRole: null,
    responses: {},
    selectedStatuses: {},
    responseError: null,

    setComplaints: (complaints) => set({ complaints }),
    setNewComplaint: (updates) => set((state) => ({ newComplaint: { ...state.newComplaint, ...updates } })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setUserRole: (role) => set({ userRole: role }),
    setResponse: (complaintId, response) => set((state) => ({
        responses: { ...state.responses, [complaintId]: response },
        responseError: null
    })),
    setSelectedStatus: (complaintId, status) => set((state) => ({
        selectedStatuses: { ...state.selectedStatuses, [complaintId]: status },
        responseError: null
    })),

    fetchUserRole: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/profile/', {
                headers: { Authorization: `Token ${token}` }
            });
            const data = await response.json();
            set({ userRole: data.role });
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    },

    fetchComplaints: async () => {
        set({ loading: true });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/v1/complaints/list/?type=admin', {
                headers: { Authorization: `Token ${token}` }
            });
            const data = await response.json();
            const adminComplaints = data.filter(complaint => complaint.complaint_type === 'admin');
            set({ complaints: adminComplaints, loading: false, error: null });
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
                    complaint_type: 'admin'
                })
            });
            
            if (response.ok) {
                set({ newComplaint: { subject: '', description: '', complaint_type: 'admin' } });
                get().fetchComplaints();
            } else {
                set({ error: 'Failed to submit complaint' });
            }
        } catch (error) {
            set({ error: 'Failed to submit complaint' });
        }
    },

    handleRespond: async (complaintId) => {
        const { responses, selectedStatuses } = get();
        const responseText = responses[complaintId] || '';
        const status = selectedStatuses[complaintId] || 'in_progress';

        if (status === 'resolved' && !responseText.trim()) {
            set({ responseError: 'A response is required when marking a complaint as resolved.' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:8000/api/v1/complaints/respond/${complaintId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`
                },
                body: JSON.stringify({
                    response: responseText,
                    status: status
                })
            });
            
            if (response.ok) {
                set((state) => ({
                    responses: { ...state.responses, [complaintId]: '' },
                    selectedStatuses: { ...state.selectedStatuses, [complaintId]: 'in_progress' },
                    responseError: null
                }));
                get().fetchComplaints();
            } else {
                set({ error: 'Failed to respond to complaint' });
            }
        } catch (error) {
            set({ error: 'Failed to respond to complaint' });
        }
    },
}));