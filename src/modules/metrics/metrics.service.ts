import TenantMetrics, { ITenantMetrics } from './models/tenantMetrics.model';
import Patient from '@modules/patient/models/patient.model';
import Appointment from '@modules/appointment/models/appointment.model';
import Payment from '@modules/payment/models/payment.model';
import { logger } from '@config/logger';
import { Types } from 'mongoose';

export class MetricsService {
    async getMetrics(tenantId: string, year: number, month: number): Promise<ITenantMetrics | null> {
        return TenantMetrics.findOne({ tenantId, 'period.year': year, 'period.month': month }).lean() as any;
    }

    async getMetricsRange(tenantId: string, startYear: number, startMonth: number, months: number): Promise<ITenantMetrics[]> {
        const periods: Array<{ year: number; month: number }> = [];
        let y = startYear;
        let m = startMonth;
        for (let i = 0; i < months; i++) {
            periods.push({ year: y, month: m });
            m++;
            if (m > 12) { m = 1; y++; }
        }

        return TenantMetrics.find({
            tenantId,
            $or: periods.map((p) => ({ 'period.year': p.year, 'period.month': p.month })),
        }).sort({ 'period.year': 1, 'period.month': 1 }).lean() as any;
    }

    /**
     * Calculate and store metrics for a given tenant and month.
     * This should run as a scheduled job (e.g., first day of each month).
     */
    async calculateMonthlyMetrics(tenantId: string, year: number, month: number): Promise<ITenantMetrics> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Patients
        const [totalPatients, activePatients, newPatients, dischargedPatients] = await Promise.all([
            Patient.countDocuments({ tenantId }),
            Patient.countDocuments({ tenantId, status: 'active' }),
            Patient.countDocuments({ tenantId, createdAt: { $gte: startDate, $lte: endDate } } as any),
            Patient.countDocuments({ tenantId, status: 'discharged', updatedAt: { $gte: startDate, $lte: endDate } } as any),
        ]);

        // Appointments
        const appointmentFilter = { tenantId, startTime: { $gte: startDate, $lte: endDate } };
        const [totalAppts, completedAppts, cancelledAppts, noShowAppts] = await Promise.all([
            Appointment.countDocuments(appointmentFilter),
            Appointment.countDocuments({ ...appointmentFilter, status: 'completed' }),
            Appointment.countDocuments({ ...appointmentFilter, status: 'cancelled' }),
            Appointment.countDocuments({ ...appointmentFilter, status: 'no_show' }),
        ]);

        const avgDuration = await Appointment.aggregate([
            { $match: { ...appointmentFilter, status: 'completed' } },
            { $group: { _id: null, avg: { $avg: '$duration' } } },
        ]);

        // Financials
        const paymentFilter = { tenantId, paymentDate: { $gte: startDate, $lte: endDate }, status: 'completed' };
        const financials = await Payment.aggregate([
            { $match: paymentFilter },
            {
                $group: {
                    _id: '$method',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalRevenue = financials.reduce((sum, f) => sum + f.total, 0);
        const totalPayments = financials.reduce((sum, f) => sum + f.count, 0);
        const byMethod: Record<string, number> = {};
        financials.forEach((f) => { byMethod[f._id] = f.total; });

        const metrics: Partial<ITenantMetrics> = {
            tenantId,
            period: { year, month },
            patients: {
                total: totalPatients,
                active: activePatients,
                new: newPatients,
                discharged: dischargedPatients,
            },
            appointments: {
                total: totalAppts,
                completed: completedAppts,
                cancelled: cancelledAppts,
                noShow: noShowAppts,
                avgDuration: avgDuration[0]?.avg || 0,
                completionRate: totalAppts > 0 ? (completedAppts / totalAppts) * 100 : 0,
            },
            financial: {
                totalRevenue,
                totalPayments,
                collectRate: totalAppts > 0 ? (totalPayments / totalAppts) * 100 : 0,
                avgSessionPrice: completedAppts > 0 ? totalRevenue / completedAppts : 0,
                byMethod,
            },
            bot: { totalMessages: 0, escalations: 0, taskCompletionRate: 0, avgResponseTimeMs: 0 },
            calculatedAt: new Date(),
        };

        const result = await TenantMetrics.findOneAndUpdate(
            { tenantId, 'period.year': year, 'period.month': month },
            { $set: metrics },
            { upsert: true, returnDocument: 'after' }
        );

        logger.info('Metrics calculated', { tenantId, year, month });
        return result as ITenantMetrics;
    }
}

export const metricsService = new MetricsService();
