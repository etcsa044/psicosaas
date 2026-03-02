import ClinicalEntry, { IClinicalEntry } from './models/clinicalEntry.model';
import { encrypt, decrypt, EncryptedField } from '@shared/utils/encryption';
import { NotFoundError } from '@shared/errors/AppError';
import { parsePaginationQuery, buildPaginationResult, PaginationResult } from '@shared/utils/pagination';
import { Types } from 'mongoose';

interface ClinicalEntryInput {
    patientId: string;
    entryDate?: string;
    entryType: string;
    content: {
        sessionNotes?: string;
        objectives?: string;
        interventionType?: string;
        emotionalState?: string;
        riskAssessment?: string;
        diagnosis?: string;
        medication?: string;
        privateNotes?: string;
    };
    duration?: number;
    appointmentId?: string;
    isPrivate?: boolean;
}

export class ClinicalRecordService {
    async create(tenantId: string, input: ClinicalEntryInput, userId: Types.ObjectId): Promise<IClinicalEntry> {
        const encryptedContent: any = {
            objectives: input.content.objectives,
            interventionType: input.content.interventionType,
            emotionalState: input.content.emotionalState,
            riskAssessment: input.content.riskAssessment,
        };

        // Encrypt sensitive fields
        if (input.content.sessionNotes) {
            encryptedContent.sessionNotes_encrypted = encrypt(input.content.sessionNotes);
        }
        if (input.content.diagnosis) {
            encryptedContent.diagnosis_encrypted = encrypt(input.content.diagnosis);
        }
        if (input.content.medication) {
            encryptedContent.medication_encrypted = encrypt(input.content.medication);
        }
        if (input.content.privateNotes) {
            encryptedContent.privateNotes_encrypted = encrypt(input.content.privateNotes);
        }

        return ClinicalEntry.create({
            tenantId,
            patientId: input.patientId,
            entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
            entryType: input.entryType,
            content: encryptedContent,
            duration: input.duration,
            appointmentId: input.appointmentId,
            isPrivate: input.isPrivate || false,
            iaAccessible: false, // ALWAYS false — enforced
            createdBy: userId,
        });
    }

    async getById(tenantId: string, entryId: string, decryptFields: boolean = true): Promise<any> {
        const entry = await ClinicalEntry.findOne({ tenantId, _id: entryId }).lean();
        if (!entry) throw new NotFoundError('ClinicalEntry');

        if (decryptFields) {
            return this.decryptEntry(entry as IClinicalEntry);
        }
        return entry;
    }

    async getByPatient(tenantId: string, patientId: string, query: any): Promise<PaginationResult<any>> {
        const { cursor, limit } = parsePaginationQuery(query);
        const filter: any = { tenantId, patientId };

        if (query.entryType) filter.entryType = query.entryType;
        if (cursor) filter._id = { $lt: cursor }; // descending order

        const results = await ClinicalEntry.find(filter)
            .sort({ entryDate: -1, _id: -1 })
            .limit(limit + 1)
            .lean() as IClinicalEntry[];

        // Decrypt all entries
        const decrypted = results.map((entry) => this.decryptEntry(entry));

        return buildPaginationResult(decrypted, limit);
    }

    async update(tenantId: string, entryId: string, input: Partial<ClinicalEntryInput>, userId: Types.ObjectId): Promise<IClinicalEntry> {
        const entry = await ClinicalEntry.findOne({ tenantId, _id: entryId });
        if (!entry) throw new NotFoundError('ClinicalEntry');

        if (input.content) {
            if (input.content.sessionNotes) {
                entry.content.sessionNotes_encrypted = encrypt(input.content.sessionNotes);
            }
            if (input.content.diagnosis) {
                entry.content.diagnosis_encrypted = encrypt(input.content.diagnosis);
            }
            if (input.content.medication) {
                entry.content.medication_encrypted = encrypt(input.content.medication);
            }
            if (input.content.privateNotes) {
                entry.content.privateNotes_encrypted = encrypt(input.content.privateNotes);
            }
            if (input.content.objectives !== undefined) entry.content.objectives = input.content.objectives;
            if (input.content.interventionType !== undefined) entry.content.interventionType = input.content.interventionType;
            if (input.content.emotionalState !== undefined) entry.content.emotionalState = input.content.emotionalState;
            if (input.content.riskAssessment !== undefined) entry.content.riskAssessment = input.content.riskAssessment;
        }

        if (input.duration !== undefined) entry.duration = input.duration;
        if (input.entryType) entry.entryType = input.entryType;
        if (input.isPrivate !== undefined) entry.isPrivate = input.isPrivate;

        entry.updatedBy = userId;
        await entry.save();
        return entry;
    }

    private decryptEntry(entry: any): any {
        const decrypted = { ...entry };
        const content = { ...entry.content };

        if (content.sessionNotes_encrypted) {
            try { content.sessionNotes = decrypt(content.sessionNotes_encrypted as EncryptedField); } catch { content.sessionNotes = '[decryption error]'; }
            delete content.sessionNotes_encrypted;
        }
        if (content.diagnosis_encrypted) {
            try { content.diagnosis = decrypt(content.diagnosis_encrypted as EncryptedField); } catch { content.diagnosis = '[decryption error]'; }
            delete content.diagnosis_encrypted;
        }
        if (content.medication_encrypted) {
            try { content.medication = decrypt(content.medication_encrypted as EncryptedField); } catch { content.medication = '[decryption error]'; }
            delete content.medication_encrypted;
        }
        if (content.privateNotes_encrypted) {
            try { content.privateNotes = decrypt(content.privateNotes_encrypted as EncryptedField); } catch { content.privateNotes = '[decryption error]'; }
            delete content.privateNotes_encrypted;
        }

        decrypted.content = content;
        return decrypted;
    }
}

export const clinicalRecordService = new ClinicalRecordService();
