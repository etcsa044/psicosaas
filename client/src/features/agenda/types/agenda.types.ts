export interface Slot {
    startAt: string; // ISO string form backend Date
    endAt: string;
    status: 'available' | 'occupied' | 'blocked';
    appointmentId?: string;
    patientName?: string;
    patientType?: string;
    appointmentType?: string;
    isRecurring?: boolean;
}

export interface DayAgenda {
    date: string; // ISO string
    slots: Slot[];
}

export interface WeekAgenda {
    weekStart: string; // ISO string
    days: DayAgenda[];
}
