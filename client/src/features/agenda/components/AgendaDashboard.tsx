'use client';

import { useAgendaUIStore } from '../stores/agendaUIStore';
import { useWeeklyAgenda } from '../hooks/useWeeklyAgenda';
import { useCreateAppointment } from '../hooks/useCreateAppointment';
import { useRescheduleAppointment } from '../hooks/useRescheduleAppointment';
import { usePatients, PatientListItem } from '../hooks/usePatients';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { PatientDraggable, DraggablePatient } from './PatientDraggable';
import { SlotDroppable } from './SlotDroppable';
import { AppointmentPopover } from './AppointmentPopover';
import { ConflictModal } from './ConflictModal';
import { Slot } from '../types/agenda.types';
import { useState, useMemo } from 'react';
import { PatientSelectModal } from './PatientSelectModal';
import { QuickCreatePatientModal } from './QuickCreatePatientModal';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import MobileAgendaView from './Mobile/MobileAgendaView';
import { useDebounce } from '../../../hooks';
import toast from 'react-hot-toast';
import axios from 'axios';

// Map API patient to draggable flat shape
function toDraggable(p: PatientListItem): DraggablePatient {
    return {
        id: p._id,
        firstName: p.personalInfo.firstName,
        lastName: p.personalInfo.lastName,
        email: p.personalInfo.email,
        phone: p.personalInfo.phone,
        patientType: p.patientType,
    };
}

export function AgendaDashboard() {
    const { viewMode, setViewMode, currentDate, currentWeekStart, next, prev, today } = useAgendaUIStore();

    // Determine API fetch window based on viewMode
    const fetchWindow = useMemo(() => {
        if (viewMode === 'month') {
            const baseDate = new Date(currentDate);
            const year = baseDate.getUTCFullYear();
            const month = baseDate.getUTCMonth();
            const firstDayOfMonth = new Date(Date.UTC(year, month, 1));

            let startOffset = firstDayOfMonth.getUTCDay() - 1;
            if (startOffset < 0) startOffset = 6;

            const startDate = new Date(Date.UTC(year, month, 1 - startOffset));
            return {
                startISO: startDate.toISOString(),
                days: 42
            };
        } else {
            // For Day and Week view, fetching the 7-day week is sufficient
            return {
                startISO: currentWeekStart,
                days: 7
            };
        }
    }, [viewMode, currentDate, currentWeekStart]);

    const { data: agenda, isLoading, isError, error } = useWeeklyAgenda(fetchWindow.startISO, fetchWindow.days);
    const { mutateAsync: createMutateAsync } = useCreateAppointment();
    const rescheduleMutation = useRescheduleAppointment();

    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const debouncedSearch = useDebounce(sidebarSearchTerm, 300);
    const { data: patientsData, isLoading: patientsLoading } = usePatients(debouncedSearch);

    const sidebarPatients = useMemo(
        () => (patientsData?.data || []).map(toDraggable),
        [patientsData]
    );

    const [selectedAppointment, setSelectedAppointment] = useState<Slot | null>(null);
    const [creatingSlot, setCreatingSlot] = useState<Slot | null>(null);
    const [droppedPatient, setDroppedPatient] = useState<{ id: string; name: string; type?: string } | null>(null);
    const [conflictError, setConflictError] = useState<{
        type: 'alert' | 'block';
        message: string;
        pendingAction?: () => void;
    } | null>(null);

    // Prevent random clicks from triggering drag events
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Format header date
    const d = new Date(viewMode === 'week' ? currentWeekStart : currentDate);
    const titleOptions: Intl.DateTimeFormatOptions = viewMode === 'day'
        ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
        : { month: 'long', year: 'numeric', timeZone: 'UTC' };

    const formattedDate = new Intl.DateTimeFormat('es-AR', titleOptions).format(d);
    const title = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const draggedType = active.data.current?.type;
        const targetType = over.data.current?.type;
        const slot = over.data.current?.slot;

        if (targetType !== 'slot' || !slot || slot.status !== 'available') return;

        if (draggedType === 'patient') {
            const patient = active.data.current?.patient;
            if (!patient) return;

            // Open the modal with the patient pre-selected so user can choose recurrence
            setDroppedPatient({ id: patient.id, name: patient.name, type: patient.patientType });
            setCreatingSlot(slot);

        } else if (draggedType === 'appointment') {
            const appointmentId = active.data.current?.appointmentId;
            if (!appointmentId) return;

            const executeReschedule = async (override = false) => {
                try {
                    const result = await rescheduleMutation.mutateAsync({
                        appointmentId,
                        newStartUTC: slot.startAt,
                        overrideFrequencyAlert: override
                    }) as any;

                    if (result?._cancellationWarning?.warning) {
                        toast(`Nota clínica: El paciente tuvo ${result._cancellationWarning.cancellationsLastPeriod} ausencias/cancelaciones recientes.`, { icon: '⚠️', duration: 6000 });
                    }

                    console.log('Reschedule Successful!');
                    setConflictError(null);
                } catch (error: any) {
                    if (axios.isAxiosError(error) && error.response) {
                        const status = error.response.status;
                        const message = error.response.data.message || 'Error de validación clínica';
                        if (status === 409) {
                            setConflictError({ type: 'alert', message, pendingAction: () => executeReschedule(true) });
                        } else if (status === 403) {
                            setConflictError({ type: 'block', message });
                        } else {
                            console.error('Reschedule failed', error);
                        }
                    }
                }
            };
            await executeReschedule();
        }
    };

    const executeCreateFromClick = async (patientId: string, slot: Slot, recurringPattern?: any, override = false) => {
        try {
            const payload: any = {
                patientId,
                startAt: slot.startAt,
                endAt: slot.endAt,
                overrideFrequencyAlert: override
            };
            if (recurringPattern) {
                payload.recurringPattern = recurringPattern;
            }
            const result = await createMutateAsync(payload) as any;

            if (result?._cancellationWarning?.warning) {
                toast(`Nota clínica: El paciente tuvo ${result._cancellationWarning.cancellationsLastPeriod} ausencias/cancelaciones recientes.`, { icon: '⚠️', duration: 6000 });
            }

            console.log('Click Booking Successful!');
            setConflictError(null);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                const status = error.response.status;
                const message = error.response.data.message || 'Error de validación clínica';
                if (status === 409) {
                    setConflictError({ type: 'alert', message, pendingAction: () => executeCreateFromClick(patientId, slot, recurringPattern, true) });
                } else if (status === 403) {
                    setConflictError({ type: 'block', message });
                } else {
                    console.error('Click Booking failed', error);
                    toast.error(`Error: ${message}`);
                }
            }
        }
    };

    const handleEmptySlotClick = (slot: Slot) => {
        // Open the patient selection modal
        setCreatingSlot(slot);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* Sidebar Left: Pacientes */}
                <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hidden lg:flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pacientes</h2>
                        <input
                            type="search"
                            placeholder="Buscar paciente..."
                            value={sidebarSearchTerm}
                            onChange={(e) => setSidebarSearchTerm(e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-md text-sm focus:border-indigo-500 focus:bg-white focus:ring-0"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                        {patientsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin w-5 h-5 text-indigo-500" />
                            </div>
                        ) : sidebarPatients.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {sidebarSearchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                            </div>
                        ) : (
                            sidebarPatients.map(p => (
                                <PatientDraggable key={p.id} patient={p} />
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content: Calendario Grid */}
                <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 overflow-hidden relative">
                    {/* Desktop Header */}
                    <header className="hidden lg:flex h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 items-center justify-between px-6 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-4">
                            <button onClick={today} className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition">
                                Hoy
                            </button>
                            <button onClick={prev} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <ChevronLeft size={20} />
                            </button>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white min-w-[160px] text-center capitalize">
                                {title}
                            </h1>
                            <button onClick={next} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <ChevronRight size={20} />
                            </button>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-4 shadow-inner">
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Día
                                </button>
                                <button
                                    onClick={() => setViewMode('week')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Semana
                                </button>
                                <button
                                    onClick={() => setViewMode('month')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Mes
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setIsQuickCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                            + Nuevo Paciente
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto lg:p-6 bg-gray-50 dark:bg-gray-900">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className="animate-spin w-8 h-8 mb-4 text-indigo-500" />
                                <p>Cargando disponibilidad...</p>
                            </div>
                        ) : isError ? (
                            <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                <p className="font-semibold mb-2">Error cargando agenda</p>
                                <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile View */}
                                <div className="block lg:hidden h-full">
                                    <MobileAgendaView
                                        appointments={agenda?.days.flatMap(d => d.slots.filter(s => s.status !== 'available').map(s => ({
                                            ...s,
                                            startTime: s.startAt,
                                            endTime: s.endAt,
                                            patientName: s.patientName || 'Paciente',
                                        }))) || []}
                                        onNewTurno={(date) => {
                                            const slot: Slot = { startAt: date.toISOString(), endAt: new Date(date.getTime() + 60 * 60000).toISOString(), status: 'available' };
                                            handleEmptySlotClick(slot);
                                        }}
                                        onStatusChange={async (id, s) => {
                                            // TODO trigger modal or reschedule api
                                            console.log("Status change mobile for", id, s)
                                        }}
                                    />
                                </div>

                                {/* Desktop View */}
                                <div className="hidden lg:block h-full">
                                    {viewMode === 'day' ? (
                                        <DayView
                                            dayAgenda={agenda?.days.find(d => d.date.toString().split('T')[0] === currentDate.split('T')[0]) || { date: currentDate, slots: [] }}
                                            onEmptySlotClick={handleEmptySlotClick}
                                            onAppointmentClick={(s) => setSelectedAppointment(s)}
                                        />
                                    ) : viewMode === 'month' ? (
                                        <MonthView agendaDays={agenda?.days} />
                                    ) : (
                                        <div className="grid grid-cols-7 gap-4 min-h-full">
                                            {agenda?.days.map((day, idx) => {
                                                const dateObj = new Date(day.date);
                                                const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' }).format(dateObj);
                                                const dayNum = dateObj.getUTCDate();
                                                const isToday = new Date().toISOString().split('T')[0] === day.date.split('T')[0];

                                                return (
                                                    <div key={idx} className="flex flex-col min-w-0">
                                                        <div className="text-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                                                            <p className={`text-xs font-semibold uppercase ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {dayName}
                                                            </p>
                                                            <p className={`text-xl mt-1 ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                {dayNum}
                                                            </p>
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            {day.slots.length === 0 ? (
                                                                <div className="h-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                                                    Bloqueado
                                                                </div>
                                                            ) : (
                                                                day.slots.map((slot, sIdx) => (
                                                                    <SlotDroppable
                                                                        key={sIdx}
                                                                        slot={slot}
                                                                        onAppointmentClick={(s) => setSelectedAppointment(s)}
                                                                        onEmptySlotClick={handleEmptySlotClick}
                                                                    />
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
            {selectedAppointment && (
                <AppointmentPopover
                    slot={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
            {conflictError && (
                <ConflictModal
                    type={conflictError.type}
                    message={conflictError.message}
                    onConfirm={() => {
                        conflictError.pendingAction?.();
                        setConflictError(null);
                    }}
                    onCancel={() => setConflictError(null)}
                />
            )}
            {creatingSlot && (
                <PatientSelectModal
                    slot={creatingSlot}
                    preSelectedPatient={droppedPatient || undefined}
                    onClose={() => { setCreatingSlot(null); setDroppedPatient(null); }}
                    onSelect={(patientId, slot, recurringPattern) => {
                        setCreatingSlot(null);
                        setDroppedPatient(null);
                        executeCreateFromClick(patientId, slot, recurringPattern);
                    }}
                />
            )}

            {isQuickCreateOpen && (
                <QuickCreatePatientModal onClose={() => setIsQuickCreateOpen(false)} />
            )}
        </DndContext>
    );
}
