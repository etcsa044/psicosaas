import { Types } from 'mongoose';
import Appointment, { IAppointment } from './models/appointment.model';
import Schedule from './models/schedule.model';
import Patient from '../patient/models/patient.model';
import { appointmentService } from './appointment.service';
import { ConflictError, NotFoundError, ForbiddenError } from '@shared/errors/AppError';
import { logAuditEvent } from '@shared/services/entityAuditLog.service';
import { addDays, addWeeks, addMonths, isBefore, isSameDay } from 'date-fns';

const MAX_RECURRING_APPOINTMENTS = 120;

export interface CreateRecurringSeriesInput {
    tenantId: string;
    patientId: Types.ObjectId;
    professionalId: Types.ObjectId;
    startAt: Date;
    endAt: Date;
    duration: number;
    type?: string;
    modality?: string;
    location?: string;
    notes?: string;
    recurringPattern: {
        frequency: 'weekly' | 'biweekly' | 'monthly';
        dayOfWeek?: number;
        interval?: number;
        seriesEndDate: Date;
        monthlyMode?: 'same_date' | 'same_weekday_position';
    };
    userId: Types.ObjectId;
    overrideFrequencyAlert?: boolean;
}

export class RecurringAppointmentService {
    /**
     * Generates a series of recurring appointments.
     * Returns the count of created appointments and the count of skipped ones due to conflicts.
     */
    async createSeries(input: CreateRecurringSeriesInput): Promise<{ createdCount: number; skippedConflicts: number }> {
        let createdCount = 0;
        let skippedConflicts = 0;

        const { tenantId, professionalId, patientId, startAt, endAt, duration, type, modality, location, notes, recurringPattern, userId, overrideFrequencyAlert } = input;

        // 1. Create Parent Appointment
        const parentStart = new Date(startAt);
        const parentEnd = new Date(endAt);

        // Validate frequency policy (same rules as individual appointments)
        const patient = await Patient.findOne({ tenantId, _id: patientId }).lean() as any;
        if (patient) {
            await appointmentService.validateFrequencyPolicy(tenantId, professionalId, patient, parentStart, overrideFrequencyAlert);
        }

        // Check conflict for parent
        const parentConflict = await this.hasConflict(tenantId, professionalId, parentStart, parentEnd);
        let parentAppointmentId: Types.ObjectId;

        if (parentConflict) {
            throw new ForbiddenError('El turno inicial tiene un conflicto. Por favor, elegí un horario disponible para comenzar la serie.');
        }

        const parentAppointment = await Appointment.create({
            tenantId,
            patientId,
            professionalId,
            startAt: parentStart,
            endAt: parentEnd,
            duration,
            type: type || 'regular_session',
            modality: modality || 'in_person',
            location,
            notes,
            isRecurring: true,
            recurringPattern: {
                frequency: recurringPattern.frequency,
                dayOfWeek: recurringPattern.dayOfWeek || parentStart.getUTCDay(),
                interval: recurringPattern.interval || 1,
                seriesEndDate: recurringPattern.seriesEndDate,
                monthlyMode: recurringPattern.monthlyMode
            },
            createdBy: userId,
            status: 'scheduled'
        });

        parentAppointmentId = parentAppointment._id as Types.ObjectId;
        createdCount++;
        logAuditEvent(tenantId, 'Appointment', parentAppointmentId, 'CREATE', userId, { note: 'Parent Recurring Series' });

        // 2. Generate Children
        let currentStart = new Date(parentStart);
        let currentEnd = new Date(parentEnd);

        const seriesEndDate = new Date(recurringPattern.seriesEndDate);
        const childAppointmentsToInsert = [];

        while (createdCount < MAX_RECURRING_APPOINTMENTS) {
            // Calculate next date based on frequency
            if (recurringPattern.frequency === 'weekly') {
                currentStart = addWeeks(currentStart, recurringPattern.interval || 1);
                currentEnd = addWeeks(currentEnd, recurringPattern.interval || 1);
            } else if (recurringPattern.frequency === 'biweekly') {
                currentStart = addWeeks(currentStart, 2);
                currentEnd = addWeeks(currentEnd, 2);
            } else if (recurringPattern.frequency === 'monthly') {
                currentStart = addMonths(currentStart, recurringPattern.interval || 1);
                currentEnd = addMonths(currentEnd, recurringPattern.interval || 1);
                // Note: handling 'same_weekday_position' logic realistically requires a more complex date math helper.
                // Assuming 'same_date' default for addMonths handling.
            }

            if (isBefore(seriesEndDate, currentStart)) {
                break; // We've passed the end date
            }

            // Check conflicts for child
            const hasConflict = await this.hasConflict(tenantId, professionalId, currentStart, currentEnd);

            if (hasConflict) {
                skippedConflicts++;
                continue; // Skip this occurrence
            }

            childAppointmentsToInsert.push({
                tenantId,
                patientId,
                professionalId,
                startAt: new Date(currentStart),
                endAt: new Date(currentEnd),
                duration,
                type: type || 'regular_session',
                modality: modality || 'in_person',
                location,
                notes,
                isRecurring: true,
                recurringPattern: {
                    frequency: recurringPattern.frequency,
                    dayOfWeek: recurringPattern.dayOfWeek || parentStart.getUTCDay(),
                    interval: recurringPattern.interval || 1,
                    parentAppointmentId,
                    seriesEndDate: recurringPattern.seriesEndDate,
                    monthlyMode: recurringPattern.monthlyMode
                },
                createdBy: userId,
                status: 'scheduled'
            });

            createdCount++;
        }

        if (childAppointmentsToInsert.length > 0) {
            await Appointment.insertMany(childAppointmentsToInsert);
        }

        return { createdCount, skippedConflicts };
    }

    private async hasConflict(tenantId: string, professionalId: Types.ObjectId, startAt: Date, endAt: Date): Promise<boolean> {
        // 1. Check existing appointments
        const existingApp = await Appointment.findOne({
            tenantId,
            professionalId,
            status: { $nin: ['cancelled', 'no_show'] },
            $or: [
                { startAt: { $lt: endAt }, endAt: { $gt: startAt } }
            ]
        });

        if (existingApp) return true;

        // 2. Check professional schedule/work hours (permissive: if no schedule, allow)
        try {
            const dayOfWeek = startAt.getUTCDay();
            const schedule = await Schedule.findOne({
                tenantId,
                professionalId,
                dayOfWeek,
            });

            // If no schedule exists for this day, allow the appointment (don't block)
            if (!schedule) return false;

            // If the schedule exists but is explicitly inactive, block
            if (!schedule.isActive) return true;

            // Check vacations
            const isVacation = schedule.vacations?.some(
                (v) => startAt >= v.startDate && startAt <= v.endDate
            );
            if (isVacation) return true;
        } catch {
            // On error, allow rather than block
            return false;
        }

        return false;
    }

    /**
     * Modifies a single instance of a recurring series (detaches it).
     */
    async modifySingle(tenantId: string, appointmentId: string, updates: any, userId: Types.ObjectId): Promise<void> {
        const appointment = await Appointment.findOne({ tenantId, _id: appointmentId });
        if (!appointment) throw new NotFoundError('Appointment');

        // Detach from series if time/date changed
        if (updates.startAt || updates.endAt) {
            appointment.recurringPattern!.parentAppointmentId = undefined;
            appointment.isRecurring = false;
        }

        Object.assign(appointment, updates);
        appointment.updatedBy = userId;
        await appointment.save();

        logAuditEvent(tenantId, 'Appointment', appointment._id as Types.ObjectId, 'UPDATE', userId, { note: 'Modified single occurrence of series' });
    }

    /**
     * Modifies all future occurrences from a given date.
     */
    async modifyFromHere(tenantId: string, appointmentId: string, updates: any, userId: Types.ObjectId): Promise<{ createdCount: number; skippedConflicts: number }> {
        const appointment = await Appointment.findOne({ tenantId, _id: appointmentId });
        if (!appointment) throw new NotFoundError('Appointment');

        const parentId = appointment.recurringPattern?.parentAppointmentId || appointment._id;

        // Cancel all future active appointments in this series
        await Appointment.updateMany(
            {
                tenantId,
                'recurringPattern.parentAppointmentId': parentId,
                startAt: { $gte: appointment.startAt },
                status: { $in: ['scheduled', 'confirmed'] }
            },
            {
                $set: {
                    status: 'cancelled',
                    cancellationSource: 'SYSTEM',
                    cancellationReason: 'Serie modificada',
                    cancelledAt: new Date(),
                    cancelledBy: userId
                }
            }
        );

        // Cancel the current one too if it's the parent (so we can regenerate)
        if (!appointment.recurringPattern?.parentAppointmentId) {
            appointment.status = 'cancelled';
            appointment.cancellationSource = 'SYSTEM';
            appointment.cancellationReason = 'Serie modificada';
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = userId;
            await appointment.save();
        }

        // Generate a new series from this point forward using the new updates properties
        const newSeriesInput: CreateRecurringSeriesInput = {
            tenantId,
            patientId: appointment.patientId,
            professionalId: appointment.professionalId,
            startAt: new Date(updates.startAt || appointment.startAt),
            endAt: new Date(updates.endAt || appointment.endAt),
            duration: updates.duration || appointment.duration,
            type: updates.type || appointment.type,
            modality: updates.modality || appointment.modality,
            location: updates.location || appointment.location,
            notes: updates.notes || appointment.notes,
            recurringPattern: {
                frequency: updates.recurringPattern?.frequency || appointment.recurringPattern!.frequency,
                dayOfWeek: updates.recurringPattern?.dayOfWeek || appointment.recurringPattern!.dayOfWeek,
                interval: updates.recurringPattern?.interval || appointment.recurringPattern!.interval,
                seriesEndDate: updates.recurringPattern?.seriesEndDate || appointment.recurringPattern!.seriesEndDate,
                monthlyMode: updates.recurringPattern?.monthlyMode || appointment.recurringPattern!.monthlyMode
            },
            userId
        };

        return this.createSeries(newSeriesInput);
    }

    /**
     * Modifies the entire series (cancels all, generates new).
     */
    async modifyAll(tenantId: string, parentId: string, updates: any, userId: Types.ObjectId): Promise<{ createdCount: number; skippedConflicts: number }> {
        const parent = await Appointment.findOne({ tenantId, _id: parentId });
        if (!parent) throw new NotFoundError('Parent Appointment');

        const effectiveParentId = parent.recurringPattern?.parentAppointmentId || parent._id;

        // Cancel all future
        await Appointment.updateMany(
            {
                tenantId,
                $or: [
                    { 'recurringPattern.parentAppointmentId': effectiveParentId },
                    { _id: effectiveParentId }
                ],
                startAt: { $gte: new Date() }, // Only future ones
                status: { $in: ['scheduled', 'confirmed'] }
            },
            {
                $set: {
                    status: 'cancelled',
                    cancellationSource: 'SYSTEM',
                    cancellationReason: 'Serie modificada por completo',
                    cancelledAt: new Date(),
                    cancelledBy: userId
                }
            }
        );

        // Re-create from parent's original start date or updated start date?
        // Usually modifying the whole series applies to future ones, or starts a new series.
        // Let's create from the next available slot or the provided startAt.
        const newSeriesInput: CreateRecurringSeriesInput = {
            tenantId,
            patientId: parent.patientId,
            professionalId: parent.professionalId,
            startAt: new Date(updates.startAt || parent.startAt),
            endAt: new Date(updates.endAt || parent.endAt),
            duration: updates.duration || parent.duration,
            type: updates.type || parent.type,
            modality: updates.modality || parent.modality,
            location: updates.location || parent.location,
            notes: updates.notes || parent.notes,
            recurringPattern: {
                frequency: updates.recurringPattern?.frequency || parent.recurringPattern!.frequency,
                dayOfWeek: updates.recurringPattern?.dayOfWeek || parent.recurringPattern!.dayOfWeek,
                interval: updates.recurringPattern?.interval || parent.recurringPattern!.interval,
                seriesEndDate: updates.recurringPattern?.seriesEndDate || parent.recurringPattern!.seriesEndDate,
                monthlyMode: updates.recurringPattern?.monthlyMode || parent.recurringPattern!.monthlyMode
            },
            userId
        };

        return this.createSeries(newSeriesInput);
    }

    /**
     * Cancels all future appointments in a series.
     */
    async cancelSeries(tenantId: string, appointmentId: string, source: 'PATIENT' | 'PROFESSIONAL' | 'SYSTEM', reason: string, userId: Types.ObjectId): Promise<void> {
        const appointment = await Appointment.findOne({ tenantId, _id: appointmentId });
        if (!appointment) throw new NotFoundError('Appointment');

        const parentId = appointment.recurringPattern?.parentAppointmentId || appointment._id;

        await Appointment.updateMany(
            {
                tenantId,
                $or: [
                    { 'recurringPattern.parentAppointmentId': parentId },
                    { _id: parentId }
                ],
                startAt: { $gte: appointment.startAt }, // Cancel from this one onwards
                status: { $in: ['scheduled', 'confirmed'] }
            },
            {
                $set: {
                    status: 'cancelled',
                    cancellationSource: source,
                    cancellationReason: reason,
                    cancelledAt: new Date(),
                    cancelledBy: userId
                }
            }
        );

        logAuditEvent(tenantId, 'AppointmentSeries', parentId as Types.ObjectId, 'CANCEL', userId, { note: 'Cancelled Series from given date', reason });
    }
}

export const recurringAppointmentService = new RecurringAppointmentService();
