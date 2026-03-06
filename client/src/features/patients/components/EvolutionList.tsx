'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Loader2, Plus, Clock, Tag, User as UserIcon, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Evolution {
    _id: string;
    title: string;
    content: string;
    tags: string[];
    date: string;
    createdAt: string;
    createdByProfessionalId: {
        _id: string;
        firstName: string;
        lastName: string;
    };
}

interface EvolutionListProps {
    patientId: string;
}

export default function EvolutionList({ patientId }: EvolutionListProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    const { data, isLoading, isError } = useQuery<{ data: Evolution[] }>({
        queryKey: ['patients', patientId, 'evolutions'],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${patientId}/evolutions`);
            return data.data;
        },
        enabled: !!patientId,
    });

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post(`/patients/${patientId}/evolutions`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'evolutions'] });
            toast.success('Evolución guardada correctamente');
            setTitle('');
            setContent('');
            setTagsInput('');
        },
        onError: () => {
            toast.error('Error al guardar la evolución');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('El título y contenido son obligatorios');
            return;
        }

        const tags = tagsInput
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        mutation.mutate({
            title: title.trim(),
            content: content.trim(),
            tags,
        });
    };

    const evolutions = data?.data || [];

    return (
        <div className="space-y-8">
            {/* Compositor de Nueva Evolución */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center">
                                <Plus size={18} />
                            </div>
                            Nueva Evolución Clínica
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Ej: Sesión terapéutica, Control de ansiedad..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full font-medium rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            required
                        />

                        <textarea
                            rows={5}
                            placeholder="Redactá las notas de evolución de la sesión libremente..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 resize-y transition-colors"
                            required
                        />

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="w-full sm:w-2/3 relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Tags separados por coma (ej: ansiedad, tareas)"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={mutation.isPending || !title.trim() || !content.trim()}
                                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Evolución'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Timeline Histórico */}
            <div className="mt-8">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                    <Clock size={16} />
                    Historial Clínico ({evolutions.length})
                </h4>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-8 text-red-500 text-sm">Error al cargar las evoluciones.</div>
                ) : evolutions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        <p className="text-gray-500 dark:text-gray-400">Aún no hay evoluciones registradas en la historia de este paciente.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pb-4">
                        {evolutions.map((evol) => (
                            <div key={evol._id} className="relative ml-6 lg:ml-8">
                                {/* Timeline marker */}
                                <div className="absolute -left-[35px] lg:-left-[43px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 bg-indigo-500 shadow-sm" />

                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h5 className="font-semibold text-gray-900 dark:text-white text-base">
                                            {evol.title}
                                        </h5>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon size={14} />
                                                {format(new Date(evol.date), "d 'de' MMMM, yyyy", { locale: es })}
                                            </span>
                                            <span className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                <UserIcon size={12} className="text-indigo-500" />
                                                Dr. {evol.createdByProfessionalId.lastName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {evol.content}
                                        </div>

                                        {evol.tags && evol.tags.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                                                {evol.tags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                        <Tag size={10} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
