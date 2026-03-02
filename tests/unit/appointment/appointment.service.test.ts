jest.mock('@modules/appointment/models/appointment.model');
jest.mock('@modules/appointment/models/schedule.model');

import { AppointmentService } from '@modules/appointment/appointment.service';
import Appointment from '@modules/appointment/models/appointment.model';
import Schedule from '@modules/appointment/models/schedule.model';
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

const service = new AppointmentService();
const userId = new Types.ObjectId();

describe('AppointmentService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        const input = {
            patientId: new Types.ObjectId().toString(),
            startTime: new Date(Date.now() + 86400000).toISOString(),
            duration: 50,
        };

        it('should create an appointment when no conflict', async () => {
            (Appointment.findOne as jest.Mock).mockResolvedValue(null);
            const expected = { _id: new Types.ObjectId(), ...input };
            (Appointment.create as jest.Mock).mockResolvedValue(expected);

            const result = await service.create('t1', input, userId);
            expect(Appointment.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: 't1', patientId: input.patientId })
            );
            expect(result).toEqual(expected);
        });

        it('should throw ConflictError when time slot conflicts', async () => {
            (Appointment.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

            await expect(service.create('t1', input, userId))
                .rejects.toThrow(ConflictError);
        });
    });

    describe('getById', () => {
        it('should return appointment when found', async () => {
            const mockAppt = { _id: 'a1', tenantId: 't1' };
            (Appointment.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockAppt),
                }),
            });

            const result = await service.getById('t1', 'a1');
            expect(result).toEqual(mockAppt);
        });

        it('should throw NotFoundError when not found', async () => {
            (Appointment.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await expect(service.getById('t1', 'nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('updateStatus', () => {
        it('should update status and save', async () => {
            const mockAppt = {
                _id: 'a1',
                status: 'scheduled',
                updatedBy: null,
                save: jest.fn().mockResolvedValue(true),
            };
            (Appointment.findOne as jest.Mock).mockResolvedValue(mockAppt);

            const result = await service.updateStatus('t1', 'a1', 'completed', userId);
            expect(result.status).toBe('completed');
            expect(mockAppt.save).toHaveBeenCalled();
        });

        it('should set cancellation fields when cancelling', async () => {
            const mockAppt = {
                _id: 'a1',
                status: 'scheduled',
                save: jest.fn().mockResolvedValue(true),
            } as any;
            (Appointment.findOne as jest.Mock).mockResolvedValue(mockAppt);

            await service.updateStatus('t1', 'a1', 'cancelled', userId, 'Patient request');
            expect(mockAppt.status).toBe('cancelled');
            expect(mockAppt.cancelledAt).toBeInstanceOf(Date);
            expect(mockAppt.cancelledBy).toEqual(userId);
            expect(mockAppt.cancellationReason).toBe('Patient request');
        });

        it('should throw NotFoundError when not found', async () => {
            (Appointment.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.updateStatus('t1', 'nope', 'completed', userId))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('update', () => {
        it('should throw ValidationError for completed appointments', async () => {
            const mockAppt = { _id: 'a1', status: 'completed' };
            (Appointment.findOne as jest.Mock).mockResolvedValue(mockAppt);

            await expect(service.update('t1', 'a1', {}, userId))
                .rejects.toThrow(ValidationError);
        });

        it('should throw NotFoundError when not found', async () => {
            (Appointment.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.update('t1', 'nope', {}, userId))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('upsertSchedule', () => {
        it('should upsert a schedule', async () => {
            const input = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 50 };
            const expected = { ...input, tenantId: 't1' };
            (Schedule.findOneAndUpdate as jest.Mock).mockResolvedValue(expected);

            const result = await service.upsertSchedule('t1', 'prof-1', input);
            expect(Schedule.findOneAndUpdate).toHaveBeenCalledWith(
                { tenantId: 't1', professionalId: 'prof-1', dayOfWeek: 1 },
                expect.objectContaining({ tenantId: 't1', professionalId: 'prof-1' }),
                expect.objectContaining({ upsert: true, returnDocument: 'after' })
            );
            expect(result).toEqual(expected);
        });
    });

    describe('getSchedule', () => {
        it('should return schedules sorted by day', async () => {
            const schedules = [{ dayOfWeek: 1 }, { dayOfWeek: 3 }];
            (Schedule.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(schedules),
                }),
            });

            const result = await service.getSchedule('t1', 'prof-1');
            expect(result).toEqual(schedules);
        });
    });
});
