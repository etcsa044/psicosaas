import Patient, { IPatient } from './models/patient.model';
import Appointment from '../appointment/models/appointment.model';
import { CreatePatientInput, UpdatePatientInput } from './patient.validation';
import { NotFoundError, ConflictError } from '@shared/errors/AppError';
import { parsePaginationQuery, buildPaginationResult, PaginationResult } from '@shared/utils/pagination';
import { logAuditEvent } from '@shared/services/entityAuditLog.service';
import { Types } from 'mongoose';

export class PatientService {
    async create(tenantId: string, input: CreatePatientInput, userId: Types.ObjectId): Promise<IPatient> {
        try {
            const patient = await Patient.create({
                tenantId,
                ...input,
                createdBy: userId,
            });

            logAuditEvent(tenantId, 'Patient', patient._id as Types.ObjectId, 'CREATE', userId);

            return patient;
        } catch (err: any) {
            if (err.code === 11000 && err.keyPattern?.['personalInfo.email']) {
                throw new ConflictError('Este email ya está registrado para otro paciente.');
            }
            throw err;
        }
    }

    async getById(tenantId: string, patientId: string): Promise<IPatient> {
        const patient = await Patient.findOne({ tenantId, _id: patientId }).lean() as IPatient | null;
        if (!patient) throw new NotFoundError('Patient');
        return patient;
    }

    async list(tenantId: string, query: any): Promise<PaginationResult<IPatient>> {
        const { cursor, limit } = parsePaginationQuery(query);
        // Enforce max limit of 20 for performance (engineer recommendation)
        const effectiveLimit = Math.min(limit, 20);
        const filter: any = { tenantId };

        if (query.status) filter.status = query.status;
        if (query.search) {
            filter.$or = [
                { 'personalInfo.firstName': { $regex: query.search, $options: 'i' } },
                { 'personalInfo.lastName': { $regex: query.search, $options: 'i' } },
                { 'personalInfo.phone': { $regex: query.search, $options: 'i' } },
                { 'personalInfo.email': { $regex: query.search, $options: 'i' } },
            ];
        }
        if (cursor) filter._id = { $gt: cursor };

        const results = await Patient.find(filter)
            .sort({ _id: 1 })
            .limit(effectiveLimit + 1)
            .lean() as IPatient[];

        return buildPaginationResult(results, effectiveLimit);
    }

    async update(tenantId: string, patientId: string, input: UpdatePatientInput, userId: Types.ObjectId): Promise<IPatient> {
        const patient = await Patient.findOneAndUpdate(
            { tenantId, _id: patientId },
            { $set: { ...input, updatedBy: userId } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!patient) throw new NotFoundError('Patient');

        logAuditEvent(tenantId, 'Patient', patient._id as Types.ObjectId, 'UPDATE', userId);

        return patient;
    }

    async softDelete(tenantId: string, patientId: string, userId: Types.ObjectId): Promise<void> {
        const patient = await Patient.findOne({ tenantId, _id: patientId });
        if (!patient) throw new NotFoundError('Patient');

        // Guard: block deletion if patient has future appointments (timezone-safe 5min buffer)
        const futureAppointments = await Appointment.countDocuments({
            tenantId,
            patientId: new Types.ObjectId(patientId),
            startAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
            status: { $in: ['scheduled', 'confirmed'] },
        });
        if (futureAppointments > 0) {
            throw new ConflictError(
                `No se puede eliminar: el paciente tiene ${futureAppointments} turno(s) futuro(s) agendado(s). Cancelalos primero.`
            );
        }

        await (patient as any).softDelete(userId.toString());
        logAuditEvent(tenantId, 'Patient', patient._id as Types.ObjectId, 'DELETE', userId);
    }

    /**
     * Get appointment history for a patient.
     * Returns scheduled, completed, and cancelled appointments (excludes soft-deleted).
     */
    async getAppointmentHistory(tenantId: string, patientId: string, query?: any): Promise<any> {
        const limit = Math.min(Number(query?.limit) || 50, 50);
        const cursor = query?.cursor;

        const filter: any = {
            tenantId,
            patientId: new Types.ObjectId(patientId),
        };
        if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) };

        const appointments = await Appointment.find(filter)
            .sort({ startAt: -1 })
            .limit(limit + 1)
            .select('startAt endAt duration status type modality cancelledAt cancellationSource cancellationReason createdAt')
            .lean();

        const hasMore = appointments.length > limit;
        const data = hasMore ? appointments.slice(0, limit) : appointments;

        return {
            data,
            pagination: {
                hasMore,
                nextCursor: hasMore ? (data[data.length - 1] as any)._id.toString() : null,
            },
        };
    }

    /**
     * Get cancellation statistics for a patient using a single aggregation pipeline.
     * Returns counts for last 30 days, 6 months, and 12 months.
     */
    async getCancellationStats(tenantId: string, patientId: string): Promise<{ last30Days: number; last6Months: number; last12Months: number }> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const twelveMonthsAgo = new Date(now); twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const result = await Appointment.aggregate([
            {
                $match: {
                    tenantId,
                    patientId: new Types.ObjectId(patientId),
                    status: 'cancelled',
                },
            },
            {
                $group: {
                    _id: null,
                    last30Days: {
                        $sum: { $cond: [{ $gte: ['$cancelledAt', thirtyDaysAgo] }, 1, 0] },
                    },
                    last6Months: {
                        $sum: { $cond: [{ $gte: ['$cancelledAt', sixMonthsAgo] }, 1, 0] },
                    },
                    last12Months: {
                        $sum: { $cond: [{ $gte: ['$cancelledAt', twelveMonthsAgo] }, 1, 0] },
                    },
                },
            },
        ]);

        if (result.length === 0) {
            return { last30Days: 0, last6Months: 0, last12Months: 0 };
        }

        return {
            last30Days: result[0].last30Days,
            last6Months: result[0].last6Months,
            last12Months: result[0].last12Months,
        };
    }

    async getDebtSummary(tenantId: string, patientId: string): Promise<{ patientId: string; name: string }> {
        const patient = await this.getById(tenantId, patientId);
        return {
            patientId: patient._id.toString(),
            name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        };
    }

    /**
     * Compute and persist patient reliability score based on cancellation history.
     * Called fire-and-forget after appointment cancellation.
     * - < 2 cancellations in 6 months → reliable
     * - 2-4 → moderate_risk
     * - > 4 → frequent_canceller
     */
    async computeReliabilityScore(tenantId: string, patientId: string): Promise<void> {
        try {
            const stats = await this.getCancellationStats(tenantId, patientId);
            let score: 'reliable' | 'moderate_risk' | 'frequent_canceller' = 'reliable';

            if (stats.last6Months > 4) {
                score = 'frequent_canceller';
            } else if (stats.last6Months >= 2) {
                score = 'moderate_risk';
            }

            await Patient.findOneAndUpdate(
                { tenantId, _id: patientId },
                { $set: { reliabilityScore: score, reliabilityComputedAt: new Date() } }
            );
        } catch {
            // Fire-and-forget: don't crash the cancel flow
        }
    }
}

export const patientService = new PatientService();
