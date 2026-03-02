jest.mock('@modules/patient/models/patient.model');

import { PatientService } from '@modules/patient/patient.service';
import Patient from '@modules/patient/models/patient.model';
import { NotFoundError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

const patientService = new PatientService();
const userId = new Types.ObjectId();

describe('PatientService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        it('should create a patient', async () => {
            const input = { personalInfo: { firstName: 'Ana', lastName: 'Gomez' } };
            const mockPatient = { _id: new Types.ObjectId(), tenantId: 't1', ...input };
            (Patient.create as jest.Mock).mockResolvedValue(mockPatient);

            const result = await patientService.create('t1', input as any, userId);
            expect(Patient.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: 't1', createdBy: userId })
            );
            expect(result).toEqual(mockPatient);
        });
    });

    describe('getById', () => {
        it('should return patient when found', async () => {
            const mockPatient = { _id: 'p1', tenantId: 't1' };
            (Patient.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPatient),
            });

            const result = await patientService.getById('t1', 'p1');
            expect(result).toEqual(mockPatient);
        });

        it('should throw NotFoundError when not found', async () => {
            (Patient.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(patientService.getById('t1', 'nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('list', () => {
        it('should return paginated results', async () => {
            const items = [
                { _id: new Types.ObjectId(), tenantId: 't1' },
                { _id: new Types.ObjectId(), tenantId: 't1' },
            ];
            (Patient.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(items),
                    }),
                }),
            });

            const result = await patientService.list('t1', {});
            expect(result.data).toHaveLength(2);
            expect(result.pagination).toBeDefined();
        });

        it('should support search filter', async () => {
            (Patient.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await patientService.list('t1', { search: 'Ana' });
            expect(Patient.find).toHaveBeenCalledWith(
                expect.objectContaining({ $or: expect.any(Array) })
            );
        });
    });

    describe('update', () => {
        it('should update and return patient', async () => {
            const updated = { _id: 'p1', personalInfo: { firstName: 'Updated' } };
            (Patient.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await patientService.update('t1', 'p1', {} as any, userId);
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundError when not found', async () => {
            (Patient.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(patientService.update('t1', 'nope', {} as any, userId))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('softDelete', () => {
        it('should soft delete patient', async () => {
            const mockPatient = { softDelete: jest.fn() };
            (Patient.findOne as jest.Mock).mockResolvedValue(mockPatient);

            await patientService.softDelete('t1', 'p1', userId);
            expect(mockPatient.softDelete).toHaveBeenCalledWith(userId.toString());
        });

        it('should throw NotFoundError when not found', async () => {
            (Patient.findOne as jest.Mock).mockResolvedValue(null);

            await expect(patientService.softDelete('t1', 'nope', userId))
                .rejects.toThrow(NotFoundError);
        });
    });
});
