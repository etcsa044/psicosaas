import Payment, { IPayment } from './models/payment.model';
import { NotFoundError } from '@shared/errors/AppError';
import { parsePaginationQuery, buildPaginationResult, PaginationResult } from '@shared/utils/pagination';
import { Types } from 'mongoose';

export class PaymentService {
    async create(tenantId: string, input: any, userId: Types.ObjectId): Promise<IPayment> {
        return Payment.create({
            tenantId,
            patientId: input.patientId,
            appointmentId: input.appointmentId,
            amount: input.amount,
            currency: input.currency || 'ARS',
            method: input.method,
            status: input.status || 'completed',
            paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
            receiptNumber: input.receiptNumber,
            notes: input.notes,
            insuranceCoverage: input.insuranceCoverage,
            createdBy: userId,
        });
    }

    async getById(tenantId: string, id: string): Promise<IPayment> {
        const payment = await Payment.findOne({ tenantId, _id: id })
            .populate('patientId', 'personalInfo.firstName personalInfo.lastName')
            .lean() as IPayment | null;
        if (!payment) throw new NotFoundError('Payment');
        return payment;
    }

    async listByPatient(tenantId: string, patientId: string, query: any): Promise<PaginationResult<IPayment>> {
        const { cursor, limit } = parsePaginationQuery(query);
        const filter: any = { tenantId, patientId };
        if (cursor) filter._id = { $lt: cursor };

        const results = await Payment.find(filter)
            .sort({ paymentDate: -1, _id: -1 })
            .limit(limit + 1)
            .lean() as IPayment[];

        return buildPaginationResult(results, limit);
    }

    async listByDateRange(tenantId: string, query: any): Promise<IPayment[]> {
        const filter: any = { tenantId };

        if (query.startDate && query.endDate) {
            filter.paymentDate = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
        }
        if (query.method) filter.method = query.method;
        if (query.status) filter.status = query.status;

        return Payment.find(filter)
            .populate('patientId', 'personalInfo.firstName personalInfo.lastName')
            .sort({ paymentDate: -1 })
            .limit(200)
            .lean() as any;
    }

    async getPatientBalance(tenantId: string, patientId: string): Promise<{ totalPaid: number; pendingAmount: number }> {
        const [paid, pending] = await Promise.all([
            Payment.aggregate([
                { $match: { tenantId, patientId: new Types.ObjectId(patientId), status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment.aggregate([
                { $match: { tenantId, patientId: new Types.ObjectId(patientId), status: 'pending' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        return {
            totalPaid: paid[0]?.total || 0,
            pendingAmount: pending[0]?.total || 0,
        };
    }

    async update(tenantId: string, id: string, input: any, userId: Types.ObjectId): Promise<IPayment> {
        const payment = await Payment.findOneAndUpdate(
            { tenantId, _id: id },
            { $set: { ...input, updatedBy: userId } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!payment) throw new NotFoundError('Payment');
        return payment;
    }

    async getMonthlyReport(tenantId: string, year: number, month: number): Promise<any> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const report = await Payment.aggregate([
            { $match: { tenantId, paymentDate: { $gte: startDate, $lte: endDate }, status: 'completed' } },
            {
                $group: {
                    _id: '$method',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const totalAmount = report.reduce((sum: number, r: any) => sum + r.total, 0);
        const totalCount = report.reduce((sum: number, r: any) => sum + r.count, 0);

        return { year, month, totalAmount, totalCount, byMethod: report };
    }
}

export const paymentService = new PaymentService();
