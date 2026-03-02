import Patient, { IPatient } from './models/patient.model';
import { CreatePatientInput, UpdatePatientInput } from './patient.validation';
import { NotFoundError } from '@shared/errors/AppError';
import { parsePaginationQuery, buildPaginationResult, PaginationResult } from '@shared/utils/pagination';
import { Types } from 'mongoose';

export class PatientService {
    async create(tenantId: string, input: CreatePatientInput, userId: Types.ObjectId): Promise<IPatient> {
        return Patient.create({
            tenantId,
            ...input,
            createdBy: userId,
        });
    }

    async getById(tenantId: string, patientId: string): Promise<IPatient> {
        const patient = await Patient.findOne({ tenantId, _id: patientId }).lean() as IPatient | null;
        if (!patient) throw new NotFoundError('Patient');
        return patient;
    }

    async list(tenantId: string, query: any): Promise<PaginationResult<IPatient>> {
        const { cursor, limit } = parsePaginationQuery(query);
        const filter: any = { tenantId };

        if (query.status) filter.status = query.status;
        if (query.search) {
            filter.$or = [
                { 'personalInfo.firstName': { $regex: query.search, $options: 'i' } },
                { 'personalInfo.lastName': { $regex: query.search, $options: 'i' } },
                { 'personalInfo.phone': { $regex: query.search, $options: 'i' } },
            ];
        }
        if (cursor) filter._id = { $gt: cursor };

        const results = await Patient.find(filter)
            .sort({ _id: 1 })
            .limit(limit + 1)
            .lean() as IPatient[];

        return buildPaginationResult(results, limit);
    }

    async update(tenantId: string, patientId: string, input: UpdatePatientInput, userId: Types.ObjectId): Promise<IPatient> {
        const patient = await Patient.findOneAndUpdate(
            { tenantId, _id: patientId },
            { $set: { ...input, updatedBy: userId } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!patient) throw new NotFoundError('Patient');
        return patient;
    }

    async softDelete(tenantId: string, patientId: string, userId: Types.ObjectId): Promise<void> {
        const patient = await Patient.findOne({ tenantId, _id: patientId });
        if (!patient) throw new NotFoundError('Patient');
        (patient as any).softDelete(userId.toString());
    }

    async getDebtSummary(tenantId: string, patientId: string): Promise<{ patientId: string; name: string }> {
        const patient = await this.getById(tenantId, patientId);
        return {
            patientId: patient._id.toString(),
            name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        };
    }
}

export const patientService = new PatientService();
