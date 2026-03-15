'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Loader2, Paperclip, File, Trash2, UploadCloud, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientDocument {
    _id: string;
    fileName: string;
    fileUrl: string;
    type: 'informe' | 'estudio' | 'receta' | 'documento' | 'otro';
    createdAt: string;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
}

interface PatientDocumentListProps {
    patientId: string;
}

export default function PatientDocumentList({ patientId }: PatientDocumentListProps) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [type, setType] = useState<PatientDocument['type']>('documento');
    const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery<{ data: PatientDocument[] }>({
        queryKey: ['patients', patientId, 'documents'],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${patientId}/documents`);
            return data.data; // unwraps array
        },
        enabled: !!patientId,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: Partial<PatientDocument>) => {
            const { data } = await api.post(`/patients/${patientId}/documents`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'documents'] });
            toast.success('Documento adjuntado exitosamente');
            setFileName('');
            setFileUrl('');
            setType('documento');
            setIsUploading(false);
        },
        onError: () => {
            toast.error('Error al adjuntar documento');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (docId: string) => {
            await api.delete(`/patients/${patientId}/documents/${docId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'documents'] });
            toast.success('Documento eliminado');
        },
        onError: () => {
            toast.error('Error al eliminar el documento');
        },
    });

    const handleMockUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName.trim() || !fileUrl.trim()) {
            toast.error('El nombre y un enlace (URL) son obligatorios para el MVP');
            return;
        }

        createMutation.mutate({
            fileName: fileName.trim(),
            fileUrl: fileUrl.trim(),
            type,
        });
    };

    const documents = data?.data || [];
    const sortedDocs = [...documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Paperclip size={20} className="text-indigo-500" />
                        Archivos Adjuntos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestioná informes, consentimientos, u otros documentos del paciente.</p>
                </div>
                <button
                    onClick={() => setIsUploading(!isUploading)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                >
                    {isUploading ? 'Cancelar' : <><UploadCloud size={16} /> Subir Archivo</>}
                </button>
            </div>

            {/* Upload Area (MVP form substituting real file upload) */}
            {isUploading && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 animate-fade-in transition-all">
                    <form onSubmit={handleMockUpload} className="space-y-4 max-w-2xl mx-auto">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-3 rounded-lg text-xs mb-4">
                            <strong>MVP Notice:</strong> Por ahora subimos un Link directo alojado externamente (ej: Google Drive, Dropbox). En la próxima fase reemplazaremos esto por la subida real a un bucket S3.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Archivo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Informe Neurológico Octubre"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as PatientDocument['type'])}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="informe">Informe</option>
                                    <option value="estudio">Estudio</option>
                                    <option value="receta">Receta</option>
                                    <option value="documento">Documento General</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace del Archivo (URL)</label>
                            <input
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Adjuntar Documento'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Document List */}
            {isLoading ? (
                <div className="flex justify-center items-center h-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                    <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
                </div>
            ) : isError ? (
                <div className="text-center py-12 text-red-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                    Error cargando los documentos.
                </div>
            ) : sortedDocs.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <File className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">El paciente no tiene documentos adjuntos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedDocs.map((doc) => (
                        <div key={doc._id} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                                <File size={24} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate"
                                        title={doc.fileName}
                                    >
                                        {doc.fileName}
                                    </a>
                                    <button
                                        onClick={() => setPendingDeleteDocId(doc._id)}
                                        disabled={deleteMutation.isPending}
                                        className="p-1 -mr-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                        {doc.type}
                                    </span>
                                    <span>•</span>
                                    <span>{format(new Date(doc.createdAt), "d MMM, yyyy", { locale: es })}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <UserIcon size={10} />
                                        {doc.uploadedBy.firstName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!pendingDeleteDocId}
                onOpenChange={(open) => !open && setPendingDeleteDocId(null)}
                title="Eliminar Documento"
                description="¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer."
                onConfirm={() => {
                    if (pendingDeleteDocId) {
                        deleteMutation.mutate(pendingDeleteDocId);
                        setPendingDeleteDocId(null);
                    }
                }}
                confirmLabel="Eliminar"
                variant="destructive"
            />
        </div>
    );
}
