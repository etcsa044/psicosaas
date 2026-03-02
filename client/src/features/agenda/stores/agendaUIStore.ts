import { create } from 'zustand';

interface AgendaUIState {
    currentWeekStart: string; // ISO string in UTC
    nextWeek: () => void;
    prevWeek: () => void;
    setWeek: (dateISO: string) => void;
}

// Ensure we start with the current date's start of the week (Monday) strictly in UTC
const getStartOfWeekUTC = (date: Date): string => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0) vs Monday start
    d.setUTCDate(diff);
    return d.toISOString();
};

export const useAgendaUIStore = create<AgendaUIState>((set) => ({
    currentWeekStart: getStartOfWeekUTC(new Date()),

    nextWeek: () => set((state) => {
        const d = new Date(state.currentWeekStart);
        d.setUTCDate(d.getUTCDate() + 7);
        return { currentWeekStart: d.toISOString() };
    }),

    prevWeek: () => set((state) => {
        const d = new Date(state.currentWeekStart);
        d.setUTCDate(d.getUTCDate() - 7);
        return { currentWeekStart: d.toISOString() };
    }),

    setWeek: (dateISO) => set({ currentWeekStart: dateISO })
}));
