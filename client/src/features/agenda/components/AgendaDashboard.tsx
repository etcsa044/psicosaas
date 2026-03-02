'use client';

import { useAgendaUIStore } from '../stores/agendaUIStore';
import { useWeeklyAgenda } from '../hooks/useWeeklyAgenda';
import { useCreateAppointment } from '../hooks/useCreateAppointment';
import { useRescheduleAppointment } from '../hooks/useRescheduleAppointment';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { PatientDraggable } from './PatientDraggable';
import { SlotDroppable } from './SlotDroppable';
import { AppointmentPopover } from './AppointmentPopover';
import { ConflictModal } from './ConflictModal';
import { Slot } from '../types/agenda.types';
import { useState } from 'react';
import axios from 'axios';

// Mock patient array using the seeded Dummy Patient ID
const patients = [
    { id: "69a46808e10d5e2e14350cd5", firstName: "Juan", lastName: "Pérez", email: "juan@demo.com" },
    { id: "69a46808e10d5e2e14350cd6", firstName: "María", lastName: "Gómez", email: "maria@demo.com" },
    { id: "69a46808e10d5e2e14350cd7", firstName: "Carlos", lastName: "López", email: "carlos@demo.com" },
    { id: "69a46808e10d5e2e14350cd8", firstName: "Ana", lastName: "Martínez", email: "ana@demo.com" },
    { id: "69a46808e10d5e2e14350cd9", firstName: "Pedro", lastName: "García", email: "pedro@demo.com" }
];

export function AgendaDashboard() {
    const { currentWeekStart, nextWeek, prevWeek } = useAgendaUIStore();
    const { data: agenda, isLoading, isError, error } = useWeeklyAgenda(currentWeekStart);
    const { mutateAsync: createMutateAsync } = useCreateAppointment();
    const rescheduleMutation = useRescheduleAppointment();

    const [selectedAppointment, setSelectedAppointment] = useState<Slot | null>(null);
    const [conflictError, setConflictError] = useState<{
        type: 'alert' | 'block';
        message: string;
        pendingAction?: () => void;
    } | null>(null);

    // Prevent random clicks from triggering drag events
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before dragging
            },
        })
    );

    // Format header date (e.g. "Febrero 2026") based on the current week start
    const monthYear = new Intl.DateTimeFormat('es-AR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(currentWeekStart));
    const title = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

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

            const executeCreate = async (override = false) => {
                try {
                    await createMutateAsync({
                        patientId: patient.id,
                        startAt: slot.startAt,
                        endAt: slot.endAt,
                        overrideFrequencyAlert: override
                    });
                    console.log('Drop & Booking Successful!');
                    setConflictError(null);
                } catch (error: any) {
                    if (axios.isAxiosError(error) && error.response) {
                        const status = error.response.status;
                        const message = error.response.data.message || 'Error de validación clínica';
                        if (status === 409) {
                            setConflictError({ type: 'alert', message, pendingAction: () => executeCreate(true) });
                        } else if (status === 403) {
                            setConflictError({ type: 'block', message });
                        } else {
                            console.error('Booking failed', error);
                        }
                    }
                }
            };
            await executeCreate();

        } else if (draggedType === 'appointment') {
            const appointmentId = active.data.current?.appointmentId;
            if (!appointmentId) return;

            const executeReschedule = async (override = false) => {
                try {
                    await rescheduleMutation.mutateAsync({
                        appointmentId,
                        newStartUTC: slot.startAt,
                        overrideFrequencyAlert: override
                    });
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

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* Sidebar Left: Pacientes */}
                <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pacientes</h2>
                        <input
                            type="search"
                            placeholder="Buscar paciente..."
                            className="mt-2 w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-md text-sm focus:border-indigo-500 focus:bg-white focus:ring-0"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                        {patients.map(p => (
                            <PatientDraggable key={p.id} patient={p} />
                        ))}
                    </div>
                </aside>

                {/* Main Content: Calendario Grid */}
                <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
                    <header className="h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-4">
                            <button onClick={prevWeek} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <ChevronLeft size={20} />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white w-40 text-center">
                                {title}
                            </h1>
                            <button onClick={nextWeek} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <ChevronRight size={20} />
                            </button>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-4">
                                <button className="px-3 py-1 text-sm font-medium rounded-md bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white">Semana</button>
                                <button className="px-3 py-1 text-sm font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Día</button>
                            </div>
                        </div>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                            + Nuevo Turno
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
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
        </DndContext>
    );
}
