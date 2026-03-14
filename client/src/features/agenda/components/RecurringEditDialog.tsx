'use client';

import * as React from 'react';
import { CalendarDays, CalendarRange, CalendarSync, X } from 'lucide-react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

interface RecurringEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actionType: 'edit' | 'cancel' | 'delete' | 'status';
    onConfirm: (mode: 'single' | 'forward' | 'all') => void;
}

export default function RecurringEditDialog({ open, onOpenChange, actionType, onConfirm }: RecurringEditDialogProps) {
    const actionMap = {
        edit: { title: 'Modificar turno frecuente', verb: 'modificar' },
        cancel: { title: 'Cancelar turno frecuente', verb: 'cancelar' },
        delete: { title: 'Eliminar turno frecuente', verb: 'eliminar' },
        status: { title: 'Cambiar estado de turno frecuente', verb: 'cambiar estado a' }
    };

    const { title, verb } = actionMap[actionType];

    return (
        <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialogPrimitive.Portal>
                <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
                <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xl rounded-xl sm:rounded-2xl duration-200 animate-in fade-in zoom-in-95">

                    <div className="flex flex-col gap-2">
                        <AlertDialogPrimitive.Title className="text-lg font-bold text-gray-900 dark:text-white">
                            {title}
                        </AlertDialogPrimitive.Title>
                        <AlertDialogPrimitive.Description className="text-sm text-gray-500 dark:text-gray-400">
                            Este turno es parte de una serie. ¿Qué turnos querés {verb}?
                        </AlertDialogPrimitive.Description>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            onClick={() => onConfirm('single')}
                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-left transition-colors"
                        >
                            <CalendarDays className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Solo este turno</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">La serie seguirá repitiéndose igual.</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onConfirm('forward')}
                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-left transition-colors"
                        >
                            <CalendarRange className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Este y los siguientes</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aplica el cambio desde acá en adelante.</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onConfirm('all')}
                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-left transition-colors"
                        >
                            <CalendarSync className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Toda la serie</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Actualiza todos los turnos, pasados y futuros.</div>
                            </div>
                        </button>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <AlertDialogPrimitive.Cancel asChild>
                            <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                                Cancelar
                            </button>
                        </AlertDialogPrimitive.Cancel>
                    </div>

                    {/* Close Button UI */}
                    <AlertDialogPrimitive.Cancel asChild>
                        <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-950 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </button>
                    </AlertDialogPrimitive.Cancel>
                </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
        </AlertDialogPrimitive.Root>
    );
}
