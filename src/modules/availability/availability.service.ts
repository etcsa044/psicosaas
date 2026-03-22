import { Types } from 'mongoose';
import AvailabilityPattern, { IAvailabilityPattern } from './models/availabilityPattern.model';
import AvailabilityException, { IAvailabilityException } from './models/availabilityException.model';

export const availabilityService = {
    /**
     * Retrieve all non-deleted availability patterns for a professional.
     */
    async getPatterns(tenantId: string, professionalId: string | Types.ObjectId) {
        return AvailabilityPattern.find({
            tenantId,
            professionalId,
            isDeleted: false,
        }).sort({ dayOfWeek: 1, startMinutes: 1 });
    },

    /**
     * Replace all availability patterns for a professional.
     */
    async updatePatterns(
        tenantId: string,
        professionalId: string | Types.ObjectId,
        patterns: Array<{
            dayOfWeek: number;
            startMinutes: number;
            endMinutes: number;
            slotDuration?: number;
            bufferMinutes?: number;
            modality?: 'in_person' | 'video_call';
        }>
    ) {
        // Soft delete all existing patterns
        await AvailabilityPattern.updateMany(
            { tenantId, professionalId, isDeleted: false },
            { $set: { isDeleted: true } }
        );

        // Insert new patterns
        if (patterns && patterns.length > 0) {
            const newPatterns = patterns.map(p => ({
                tenantId,
                professionalId,
                dayOfWeek: p.dayOfWeek,
                startMinutes: p.startMinutes,
                endMinutes: p.endMinutes,
                slotDuration: p.slotDuration || 45,
                bufferMinutes: p.bufferMinutes || 0,
                modality: p.modality || 'in_person',
            }));
            await AvailabilityPattern.insertMany(newPatterns);
        }

        return this.getPatterns(tenantId, professionalId);
    },

    /**
     * Retrieve all non-deleted availability exceptions for a professional (e.g., within a month).
     */
    async getExceptions(tenantId: string, professionalId: string | Types.ObjectId, startDate?: Date, endDate?: Date) {
        const query: any = {
            tenantId,
            professionalId,
            isDeleted: false,
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        return AvailabilityException.find(query).sort({ date: 1 });
    },

    /**
     * Add or Update an availability exception (e.g., a blocked day).
     * If an exception for the exact date exists, it updates it. Else inserts.
     */
    async setException(
        tenantId: string,
        professionalId: string | Types.ObjectId,
        date: Date, // should be 00:00:00 UTC
        blocked: boolean,
        reason?: string,
        customSlots?: Array<{ startMinutes: number; endMinutes: number }>
    ) {
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

        let exception = await AvailabilityException.findOne({
            tenantId,
            professionalId,
            date: utcDate,
            isDeleted: false,
        });

        if (exception) {
            exception.blocked = blocked;
            if (reason !== undefined) exception.reason = reason;
            if (customSlots !== undefined) exception.customSlots = customSlots;
            await exception.save();
        } else {
            exception = await AvailabilityException.create({
                tenantId,
                professionalId,
                date: utcDate,
                blocked,
                reason,
                customSlots,
            });
        }

        return exception;
    },

    /**
     * Soft delete an exception.
     */
    async removeException(tenantId: string, professionalId: string | Types.ObjectId, exceptionId: string | Types.ObjectId) {
        const exception = await AvailabilityException.findOne({
            _id: exceptionId,
            tenantId,
            professionalId,
            isDeleted: false,
        });

        if (!exception) {
            throw new Error('Exception not found or already deleted');
        }

        exception.isDeleted = true;
        await exception.save();

        return { success: true };
    }
};
