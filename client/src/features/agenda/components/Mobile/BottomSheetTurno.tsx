'use client';

import { Drawer } from 'vaul';
import { useState, useMemo } from 'react';
import { X, Search, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatients, PatientListItem } from '../../hooks/usePatients';

interface BottomSheetTurnoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: Date;
    /** Available slots for all days (from agenda backend) */
    availableSlots?: { startAt: string; endAt: string; status: string }[];
    onConfirm: (data: any) => Promise<void>;
}

export default function BottomSheetTurno({ open, onOpenChange, initialDate, availableSlots = [], onConfirm }: BottomSheetTurnoProps) {
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
    const [selectedType, setSelectedType] = useState('Primera sesión');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ startAt: string; endAt: string } | null>(null);

    // Recurring State
    const [frequency, setFrequency] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
    const [durationMonths, setDurationMonths] = useState<number>(3);

    // Real patient search
    const { data: patientsData, isLoading: patientsLoading } = usePatients(patientSearch);
    const patients = useMemo(() => patientsData?.data || [], [patientsData]);

    // Group available slots by date for time selection
    const slotsByDate = useMemo(() => {
        const map = new Map<string, { startAt: string; endAt: string }[]>();
        availableSlots
            .filter(s => s.status === 'available')
            .forEach(s => {
                const dateKey = s.startAt.split('T')[0];
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey)!.push({ startAt: s.startAt, endAt: s.endAt });
            });
        return map;
    }, [availableSlots]);

    // Determine current date for slot listing
    const currentDateKey = useMemo(() => {
        if (selectedSlot) return selectedSlot.startAt.split('T')[0];
        if (initialDate) return initialDate.toISOString().split('T')[0];
        return new Date().toISOString().split('T')[0];
    }, [initialDate, selectedSlot]);

    const currentDaySlots = slotsByDate.get(currentDateKey) || [];

    // Set initial slot from initialDate if available
    useMemo(() => {
        if (initialDate && !selectedSlot) {
            const iso = initialDate.toISOString();
            const matching = availableSlots.find(s => s.startAt === iso && s.status === 'available');
            if (matching) setSelectedSlot({ startAt: matching.startAt, endAt: matching.endAt });
        }
    }, [initialDate, availableSlots]);

    const handleSelectPatient = (p: PatientListItem) => {
        setSelectedPatient(p);
        setPatientSearch(`${p.personalInfo.firstName} ${p.personalInfo.lastName}`);
    };

    const handleConfirm = async () => {
        if (!selectedPatient || !selectedSlot) return;
        setIsSaving(true);
        try {
            const appointmentData: any = {
                patientId: selectedPatient._id,
                type: selectedType,
                startAt: selectedSlot.startAt,
                endAt: selectedSlot.endAt,
            };

            if (frequency !== 'none') {
                const seriesEndDate = new Date(selectedSlot.startAt);
                seriesEndDate.setMonth(seriesEndDate.getMonth() + durationMonths);
                appointmentData.recurringPattern = {
                    frequency,
                    interval: 1,
                    seriesEndDate,
                };
            }

            await onConfirm(appointmentData);
            // Reset state
            setSelectedPatient(null);
            setPatientSearch('');
            setSelectedSlot(null);
            setFrequency('none');
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatSlotTime = (isoStr: string) => {
        const d = new Date(isoStr);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    };

    const formatDateLabel = (isoStr: string) => {
        const d = new Date(isoStr);
        return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
                <Drawer.Content className="bg-white dark:bg-gray-900 flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none pb-safe">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-t-[20px] flex-1 flex flex-col gap-4 mx-auto w-full max-w-md overflow-y-auto hide-scrollbar">
                        {/* Handle */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-4" />

                        <div className="flex items-center justify-between mb-2">
                            <Drawer.Title className="font-bold text-xl text-gray-900 dark:text-white">
                                Nuevo Turno
                            </Drawer.Title>
                            <button onClick={() => onOpenChange(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Selected Time */}
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-2">
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                {selectedSlot
                                    ? `📅 ${formatDateLabel(selectedSlot.startAt)} — ${formatSlotTime(selectedSlot.startAt)} a ${formatSlotTime(selectedSlot.endAt)}`
                                    : '📅 Seleccioná un horario disponible abajo'}
                            </p>
                        </div>

                        {/* Time Slot Selector */}
                        {currentDaySlots.length > 0 && (
                            <div className="mb-2 shrink-0">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Horarios disponibles
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {currentDaySlots.map((slot, idx) => {
                                        const isSelected = selectedSlot?.startAt === slot.startAt;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                }`}
                                            >
                                                {formatSlotTime(slot.startAt)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Patient Search */}
                        <div className="relative mb-2 shrink-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Paciente
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition text-gray-900 dark:text-white"
                                    placeholder="Buscar paciente por nombre..."
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        if (selectedPatient) setSelectedPatient(null);
                                    }}
                                />
                            </div>

                            {/* Patient Results Dropdown */}
                            {patientSearch.length > 0 && !selectedPatient && (
                                <div className="mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                                    {patientsLoading ? (
                                        <div className="p-4 text-center text-sm text-gray-400">Buscando...</div>
                                    ) : patients.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">No se encontraron pacientes</div>
                                    ) : (
                                        patients.map((p) => (
                                            <button
                                                key={p._id}
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {p.personalInfo.firstName} {p.personalInfo.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.patientType}</p>
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase font-bold">
                                                    {p.patientType}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Selected Patient Chip */}
                            {selectedPatient && (
                                <div className="mt-2 flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                        {selectedPatient.personalInfo.firstName} {selectedPatient.personalInfo.lastName}
                                    </span>
                                    <button
                                        onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                                        className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Session Type */}
                        <div className="mb-2 shrink-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de sesión
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option>Primera sesión</option>
                                <option>Seguimiento</option>
                                <option>Aptitud Psicológica</option>
                            </select>
                        </div>

                        {/* Repetir Turno */}
                        <div className="mb-4 shrink-0 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Repetir turno
                            </label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {(
                                    [
                                        { id: 'none', label: 'No repetir' },
                                        { id: 'weekly', label: 'Cada semana' },
                                        { id: 'biweekly', label: 'Cada 2 sem.' },
                                        { id: 'monthly', label: 'Cada mes' },
                                    ] as const
                                ).map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFrequency(option.id)}
                                        className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${frequency === option.id
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {frequency !== 'none' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Duración de la serie
                                    </label>
                                    <select
                                        value={durationMonths}
                                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                                        className="block w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value={1}>1 mes</option>
                                        <option value={3}>3 meses</option>
                                        <option value={6}>6 meses</option>
                                        <option value={12}>12 meses</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-h-[1rem]" />

                        {/* Bottom Action */}
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button
                                onClick={handleConfirm}
                                disabled={isSaving || !selectedPatient || !selectedSlot}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar Turno'}
                            </button>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
