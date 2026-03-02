jest.mock('@modules/payment/models/payment.model');

import { PaymentService } from '@modules/payment/payment.service';
import Payment from '@modules/payment/models/payment.model';
import { NotFoundError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

const service = new PaymentService();
const userId = new Types.ObjectId();

describe('PaymentService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        it('should create a payment', async () => {
            const input = { patientId: 'p1', amount: 5000, method: 'cash' };
            const expected = { _id: new Types.ObjectId(), ...input };
            (Payment.create as jest.Mock).mockResolvedValue(expected);

            const result = await service.create('t1', input, userId);
            expect(Payment.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: 't1', amount: 5000, createdBy: userId })
            );
            expect(result).toEqual(expected);
        });
    });

    describe('getById', () => {
        it('should return payment when found', async () => {
            const mockPayment = { _id: 'pay1', amount: 5000 };
            (Payment.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockPayment),
                }),
            });

            const result = await service.getById('t1', 'pay1');
            expect(result).toEqual(mockPayment);
        });

        it('should throw NotFoundError when not found', async () => {
            (Payment.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            await expect(service.getById('t1', 'nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('update', () => {
        it('should update and return payment', async () => {
            const updated = { _id: 'pay1', amount: 6000 };
            (Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await service.update('t1', 'pay1', { amount: 6000 }, userId);
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundError when not found', async () => {
            (Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(service.update('t1', 'nope', {}, userId))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('getPatientBalance', () => {
        it('should return total paid and pending amounts', async () => {
            (Payment.aggregate as jest.Mock)
                .mockResolvedValueOnce([{ _id: null, total: 15000 }])  // paid
                .mockResolvedValueOnce([{ _id: null, total: 5000 }]); // pending

            const result = await service.getPatientBalance('t1', new Types.ObjectId().toString());
            expect(result.totalPaid).toBe(15000);
            expect(result.pendingAmount).toBe(5000);
        });

        it('should return 0 when no payments exist', async () => {
            (Payment.aggregate as jest.Mock)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const result = await service.getPatientBalance('t1', new Types.ObjectId().toString());
            expect(result.totalPaid).toBe(0);
            expect(result.pendingAmount).toBe(0);
        });
    });

    describe('getMonthlyReport', () => {
        it('should return monthly report by method', async () => {
            (Payment.aggregate as jest.Mock).mockResolvedValue([
                { _id: 'cash', count: 5, total: 25000 },
                { _id: 'transfer', count: 3, total: 15000 },
            ]);

            const result = await service.getMonthlyReport('t1', 2026, 2);
            expect(result.year).toBe(2026);
            expect(result.month).toBe(2);
            expect(result.totalAmount).toBe(40000);
            expect(result.totalCount).toBe(8);
            expect(result.byMethod).toHaveLength(2);
        });
    });
});
