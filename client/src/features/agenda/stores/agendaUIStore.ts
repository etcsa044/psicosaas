import { create } from 'zustand';

export type ViewMode = 'day' | 'week' | 'month';

interface AgendaUIState {
    viewMode: ViewMode;
    currentDate: string; // ISO string in UTC
    setViewMode: (mode: ViewMode) => void;
    next: () => void;
    prev: () => void;
    today: () => void;
    setDate: (dateISO: string) => void;

    // Kept for backward compatibility with components still using week exclusively
    currentWeekStart: string;
    nextWeek: () => void;
    prevWeek: () => void;
    setWeek: (dateISO: string) => void;
}

const getStartOfWeekUTC = (date: Date): string => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay();
    // If it's Sunday (0), switch to the upcoming Monday (+1) instead of the previous Monday (-6)
    const diff = d.getUTCDate() - day + (day === 0 ? 1 : 1);
    d.setUTCDate(diff);
    return d.toISOString();
};

const getStartOfDayUTC = (date: Date): string => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    return d.toISOString();
};

export const useAgendaUIStore = create<AgendaUIState>((set, get) => ({
    viewMode: 'week',
    currentDate: getStartOfDayUTC(new Date()),

    currentWeekStart: getStartOfWeekUTC(new Date()),

    setViewMode: (mode) => set({ viewMode: mode }),

    next: () => set((state) => {
        const d = new Date(state.currentDate);
        if (state.viewMode === 'day') {
            d.setUTCDate(d.getUTCDate() + 1);
        } else if (state.viewMode === 'week') {
            d.setUTCDate(d.getUTCDate() + 7);
        } else if (state.viewMode === 'month') {
            d.setUTCMonth(d.getUTCMonth() + 1);
        }
        return {
            currentDate: d.toISOString(),
            currentWeekStart: state.viewMode === 'week' ? getStartOfWeekUTC(d) : state.currentWeekStart
        };
    }),

    prev: () => set((state) => {
        const d = new Date(state.currentDate);
        if (state.viewMode === 'day') {
            d.setUTCDate(d.getUTCDate() - 1);
        } else if (state.viewMode === 'week') {
            d.setUTCDate(d.getUTCDate() - 7);
        } else if (state.viewMode === 'month') {
            d.setUTCMonth(d.getUTCMonth() - 1);
        }
        return {
            currentDate: d.toISOString(),
            currentWeekStart: state.viewMode === 'week' ? getStartOfWeekUTC(d) : state.currentWeekStart
        };
    }),

    today: () => set((state) => {
        const d = new Date();
        return {
            currentDate: getStartOfDayUTC(d),
            currentWeekStart: getStartOfWeekUTC(d)
        };
    }),

    setDate: (dateISO) => set((state) => {
        const d = new Date(dateISO);
        return {
            currentDate: getStartOfDayUTC(d),
            currentWeekStart: getStartOfWeekUTC(d)
        };
    }),

    // Legacy proxies
    nextWeek: () => set((state) => {
        const d = new Date(state.currentWeekStart);
        d.setUTCDate(d.getUTCDate() + 7);
        return { currentWeekStart: d.toISOString(), currentDate: d.toISOString() };
    }),

    prevWeek: () => set((state) => {
        const d = new Date(state.currentWeekStart);
        d.setUTCDate(d.getUTCDate() - 7);
        return { currentWeekStart: d.toISOString(), currentDate: d.toISOString() };
    }),

    setWeek: (dateISO) => set({ currentWeekStart: dateISO, currentDate: dateISO })
}));
