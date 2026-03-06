import { Request, Response, NextFunction } from 'express';
import { PatientDocument } from './models/document.model';
import { logAuditEvent } from '@shared/services/entityAuditLog.service';
import { AppError } from '@shared/errors/AppError';

export const documentController = {
    async createDoc(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId } = req.params;
            const payload = req.body;
            const professionalId = (req as any).user._id;

            const document = await PatientDocument.create({
                ...payload,
                patientId,
                uploadedBy: professionalId,
            });

            await logAuditEvent(
                (req as any).tenantId,
                'Patient',
                patientId as any,
                'CREATE',
                professionalId,
                { documentId: document._id.toString(), fileName: document.fileName }
            );

            return res.status(201).json({ status: 'success', data: document });
        } catch (error) {
            next(error);
        }
    },

    async listDocs(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId } = req.params;

            const documents = await PatientDocument.find({ patientId })
                .sort({ createdAt: -1 })
                .populate('uploadedBy', 'firstName lastName');

            return res.status(200).json({ status: 'success', data: { data: documents } });
        } catch (error) {
            next(error);
        }
    },

    async deleteDoc(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId, docId } = req.params;
            const professionalId = (req as any).user._id;

            const document = await PatientDocument.findOneAndDelete({ _id: docId, patientId });

            if (!document) {
                throw new AppError('Documento no encontrado', 404);
            }

            await logAuditEvent(
                (req as any).tenantId,
                'Patient',
                patientId as any,
                'DELETE',
                professionalId,
                { documentId: document._id.toString(), fileName: document.fileName }
            );

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};
