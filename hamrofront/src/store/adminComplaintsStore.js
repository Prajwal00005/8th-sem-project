import { create } from 'zustand';

export const useAdminComplaintsStore = create((set, get) => ({
    residentComplaints: [],
    adminComplaints: [],
    newComplaint: { subject: '', description: '', room_number: '', complaint_type: 'admin' },
    loading: true,
    error: null,
    userRole: null,
    residentResponses: {},
    residentStatuses: {},
    responseError: null,

    setResidentComplaints: (complaints) => set({ residentComplaints: complaints }),
    setAdminComplaints: (complaints) => set({ adminComplaints: complaints }),
    setNewComplaint: (updates) => set((state) => ({ newComplaint: { ...state.newComplaint, ...updates } })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setUserRole: (role) => set({ userRole: role }),
    setResidentResponse: (complaintId, response) => set((state) => ({
        residentResponses: { ...state.residentResponses, [complaintId]: response },
        responseError: null
    })),
    setResidentStatus: (complaintId, status) => set((state) => ({
        residentStatuses: { ...state.residentStatuses, [complaintId]: status },
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
            const response = await fetch('http://127.0.0.1:8000/api/v1/complaints/list/', {
                headers: { Authorization: `Token ${token}` }
            });
            const data = await response.json();
            const residentComplaints = data.filter(c => c.complaint_type === 'resident' || !c.complaint_type);
            const adminComplaints = data.filter(c => c.complaint_type === 'admin');
            set({
                residentComplaints,
                adminComplaints,
                loading: false,
                error: null
            });
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
                set({ newComplaint: { subject: '', description: '', room_number: '', complaint_type: 'admin' } });
                get().fetchComplaints();
            } else {
                set({ error: 'Failed to submit complaint' });
            }
        } catch (error) {
            set({ error: 'Failed to submit complaint' });
        }
    },

    handleResidentRespond: async (complaintId) => {
        const { residentResponses, residentStatuses } = get();
        const responseText = residentResponses[complaintId] || '';
        const status = residentStatuses[complaintId] || 'in_progress';

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
                    residentResponses: { ...state.residentResponses, [complaintId]: '' },
                    residentStatuses: { ...state.residentStatuses, [complaintId]: 'in_progress' },
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