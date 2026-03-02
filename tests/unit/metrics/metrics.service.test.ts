jest.mock('@config/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@modules/metrics/models/tenantMetrics.model');
jest.mock('@modules/patient/models/patient.model');
jest.mock('@modules/appointment/models/appointment.model');
jest.mock('@modules/payment/models/payment.model');

import { MetricsService } from '@modules/metrics/metrics.service';
import TenantMetrics from '@modules/metrics/models/tenantMetrics.model';
import Patient from '@modules/patient/models/patient.model';
import Appointment from '@modules/appointment/models/appointment.model';
import Payment from '@modules/payment/models/payment.model';

const service = new MetricsService();

describe('MetricsService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getMetrics', () => {
        it('should return metrics for a given period', async () => {
            const metrics = { tenantId: 't1', period: { year: 2026, month: 2 } };
            (TenantMetrics.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(metrics),
            });

            const result = await service.getMetrics('t1', 2026, 2);
            expect(result).toEqual(metrics);
        });

        it('should return null when no metrics found', async () => {
            (TenantMetrics.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getMetrics('t1', 2020, 1);
            expect(result).toBeNull();
        });
    });

    describe('getMetricsRange', () => {
        it('should return metrics for multiple months', async () => {
            const metricsArr = [
                { period: { year: 2026, month: 1 } },
                { period: { year: 2026, month: 2 } },
            ];
            (TenantMetrics.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(metricsArr),
                }),
            });

            const result = await service.getMetricsRange('t1', 2026, 1, 2);
            expect(result).toHaveLength(2);
        });

        it('should handle year roll-over', async () => {
            (TenantMetrics.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            await service.getMetricsRange('t1', 2026, 11, 3);
            // Should query for months 11, 12 of 2026 and month 1 of 2027
            expect(TenantMetrics.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    $or: expect.arrayContaining([
                        expect.objectContaining({ 'period.year': 2026, 'period.month': 11 }),
                        expect.objectContaining({ 'period.year': 2026, 'period.month': 12 }),
                        expect.objectContaining({ 'period.year': 2027, 'period.month': 1 }),
                    ]),
                })
            );
        });
    });

    describe('calculateMonthlyMetrics', () => {
        it('should calculate and store metrics', async () => {
            // Mock patient counts
            (Patient.countDocuments as jest.Mock)
                .mockResolvedValueOnce(50)   // total
                .mockResolvedValueOnce(40)   // active
                .mockResolvedValueOnce(5)    // new
                .mockResolvedValueOnce(2);   // discharged

            // Mock appointment counts
            (Appointment.countDocuments as jest.Mock)
                .mockResolvedValueOnce(100)  // total
                .mockResolvedValueOnce(85)   // completed
                .mockResolvedValueOnce(10)   // cancelled
                .mockResolvedValueOnce(5);   // no_show

            // Mock avg duration
            (Appointment.aggregate as jest.Mock).mockResolvedValue([{ _id: null, avg: 48 }]);

            // Mock financials
            (Payment.aggregate as jest.Mock).mockResolvedValue([
                { _id: 'cash', total: 100000, count: 20 },
                { _id: 'transfer', total: 50000, count: 10 },
            ]);

            // Mock upsert
            const storedMetrics = { tenantId: 't1', period: { year: 2026, month: 2 } };
            (TenantMetrics.findOneAndUpdate as jest.Mock).mockResolvedValue(storedMetrics);

            const result = await service.calculateMonthlyMetrics('t1', 2026, 2);
            expect(TenantMetrics.findOneAndUpdate).toHaveBeenCalledWith(
                { tenantId: 't1', 'period.year': 2026, 'period.month': 2 },
                {
                    $set: expect.objectContaining({
                        tenantId: 't1',
                        patients: expect.objectContaining({ total: 50, active: 40 }),
                        appointments: expect.objectContaining({ total: 100, completed: 85 }),
                        financial: expect.objectContaining({ totalRevenue: 150000, totalPayments: 30 }),
                    }),
                },
                expect.objectContaining({ upsert: true, returnDocument: 'after' })
            );
            expect(result).toEqual(storedMetrics);
        });
    });
});
