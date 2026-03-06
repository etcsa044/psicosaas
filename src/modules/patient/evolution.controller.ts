import { Request, Response, NextFunction } from 'express';
import { Evolution } from './models/evolution.model';
import { PatientDocument } from './models/document.model';
import { logAuditEvent } from '@shared/services/entityAuditLog.service';
import { AppError } from '@shared/errors/AppError';

export const evolutionController = {
    async createEvol(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId } = req.params;
            const payload = req.body;
            // The audit middleware injected req.user
            const professionalId = (req as any).user._id;

            const evolution = await Evolution.create({
                ...payload,
                patientId,
                createdByProfessionalId: professionalId,
            });

            // Audit
            await logAuditEvent(
                (req as any).tenantId,
                'Patient',
                patientId as any,
                'CREATE',
                professionalId,
                { evolutionId: evolution._id.toString(), title: evolution.title }
            );

            return res.status(201).json({ status: 'success', data: evolution });
        } catch (error) {
            next(error);
        }
    },

    async listEvol(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId } = req.params;

            const evolutions = await Evolution.find({ patientId, isDeleted: false })
                .sort({ date: -1, createdAt: -1 })
                .populate('createdByProfessionalId', 'firstName lastName')
                .populate('appointmentId', 'date time startTime');

            return res.status(200).json({ status: 'success', data: { data: evolutions } });
        } catch (error) {
            next(error);
        }
    },

    async updateEvol(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId, evolId } = req.params;
            const payload = req.body;
            const professionalId = (req as any).user._id;

            const evolution = await Evolution.findOneAndUpdate(
                { _id: evolId, patientId, isDeleted: false },
                { $set: payload },
                { new: true }
            );

            if (!evolution) {
                throw new AppError('Evolución no encontrada', 404);
            }

            await logAuditEvent(
                (req as any).tenantId,
                'Patient',
                patientId as any,
                'UPDATE',
                professionalId,
                { evolutionId: evolution._id.toString(), updatedFields: Object.keys(payload) }
            );

            return res.status(200).json({ status: 'success', data: evolution });
        } catch (error) {
            next(error);
        }
    },

    async deleteEvol(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: patientId, evolId } = req.params;
            const professionalId = (req as any).user._id;

            // Soft delete
            const evolution = await Evolution.findOneAndUpdate(
                { _id: evolId, patientId, isDeleted: false },
                { $set: { isDeleted: true, deletedAt: new Date() } },
                { new: true }
            );

            if (!evolution) {
                throw new AppError('Evolución no encontrada', 404);
            }

            await logAuditEvent(
                (req as any).tenantId,
                'Patient',
                patientId as any,
                'DELETE',
                professionalId,
                { evolutionId: evolution._id.toString(), softDeleted: true }
            );

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};
