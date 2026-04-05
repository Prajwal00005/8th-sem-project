import { create } from 'zustand';

export const useResidentDashboardStore = create((set) => ({
    currentPage: 'dashboard',
    setCurrentPage: (page) => set({ currentPage: page }),
    handleLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    },
}));