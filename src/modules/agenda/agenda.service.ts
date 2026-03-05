import mongoose, { Types } from 'mongoose';
import AvailabilityPattern from '../availability/models/availabilityPattern.model';
import AvailabilityException from '../availability/models/availabilityException.model';
import Appointment, { IAppointment } from '../appointment/models/appointment.model';
import { professionalSettingsService } from '../professional-settings/professionalSettings.service';
import { appointmentService } from '../appointment/appointment.service';
import { logAuditEvent } from '@shared/services/entityAuditLog.service';
import Patient from '../patient/models/patient.model';

interface Slot {
    startAt: Date;
    endAt: Date;
    status: 'available' | 'occupied' | 'blocked';
    appointmentId?: string;
    patientName?: string;
    patientType?: string;
}

interface DayAgenda {
    date: Date;
    slots: Slot[];
}

interface WeekAgenda {
    weekStart: Date;
    days: DayAgenda[];
}

export const generateWeeklySlots = async (
    tenantId: string,
    professionalId: Types.ObjectId,
    startDateUTC: Date
): Promise<WeekAgenda> => {
    // Force to Start of Day UTC
    const weekStart = new Date(Date.UTC(startDateUTC.getUTCFullYear(), startDateUTC.getUTCMonth(), startDateUTC.getUTCDate()));

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    // 0. Fetch Professional Settings for Global Slot Duration
    const settings = await professionalSettingsService.getOrCreateSettings(tenantId, professionalId);
    const globalSlotDuration = settings.defaultRules?.appointmentDurationMinutes || 45;

    // 1. Fetch Availability Patterns
    const patterns = await AvailabilityPattern.find({
        tenantId,
        professionalId,
        isDeleted: false,
    });

    // 2. Fetch Exceptions
    const exceptions = await AvailabilityException.find({
        tenantId,
        professionalId,
        isDeleted: false,
        date: { $gte: weekStart, $lt: weekEnd },
    });

    // 3. Fetch Existing Appointments (Optimized index: { tenantId: 1, professionalId: 1, startAt: 1, status: 1 })
    const appointments = await Appointment.find({
        tenantId,
        professionalId,
        isDeleted: false,
        status: { $in: ['scheduled', 'confirmed', 'pending_confirmation'] }, // Exclude cancelled/completed from blocking
        startAt: { $gte: weekStart, $lt: weekEnd },
    }).populate({ path: 'patientId', select: 'personalInfo patientType', match: { tenantId } }).sort({ startAt: 1 });

    const agenda: WeekAgenda = {
        weekStart,
        days: [],
    };

    // Construct the 7 days grid
    for (let i = 0; i < 7; i++) {
        const currentDayUTC = new Date(weekStart);
        currentDayUTC.setUTCDate(weekStart.getUTCDate() + i);
        const dayOfWeek = currentDayUTC.getUTCDay();

        // Check if there is an exception for this specific date
        const exception = exceptions.find(ex => ex.date.getTime() === currentDayUTC.getTime());

        let daySlots: Slot[] = [];

        if (exception?.blocked) {
            // Full day blocked
            agenda.days.push({ date: currentDayUTC, slots: [] });
            continue;
        }

        // Determine effective availability strategy for this day
        let effectivePeriods: Array<{ startMinutes: number, endMinutes: number }> = [];
        let slotDuration = globalSlotDuration; // Always use Global Settings duration
        let bufferMinutes = 5;

        if (exception?.customSlots?.length) {
            // Use Custom Schedule from Exception
            effectivePeriods = exception.customSlots;
        } else {
            // Find standard Pattern for this Day Of Week
            const pattern = patterns.find(p => p.dayOfWeek === dayOfWeek);
            if (pattern) {
                effectivePeriods = [{ startMinutes: pattern.startMinutes, endMinutes: pattern.endMinutes }];
                // Note: The globalSlotDuration completely overrides the old localized pattern.slotDuration
                bufferMinutes = pattern.bufferMinutes;
            }
        }

        // Generate Slots iteratively across periods
        for (const period of effectivePeriods) {
            let currentCursorMinutes = period.startMinutes;

            while (currentCursorMinutes + slotDuration <= period.endMinutes) {
                const slotStartDateTime = new Date(currentDayUTC);
                slotStartDateTime.setUTCMinutes(currentDayUTC.getUTCMinutes() + currentCursorMinutes);

                const slotEndDateTime = new Date(slotStartDateTime);
                slotEndDateTime.setUTCMinutes(slotStartDateTime.getUTCMinutes() + slotDuration);

                // Check Overlaps against Appointments
                const occupiedAppt = appointments.find(appt =>
                    (appt.startAt < slotEndDateTime && appt.endAt > slotStartDateTime)
                );

                daySlots.push({
                    startAt: slotStartDateTime,
                    endAt: slotEndDateTime,
                    status: occupiedAppt ? 'occupied' : 'available',
                    appointmentId: occupiedAppt ? occupiedAppt._id.toString() : undefined,
                    patientName: occupiedAppt ? `${(occupiedAppt.patientId as any)?.personalInfo?.firstName || ''} ${(occupiedAppt.patientId as any)?.personalInfo?.lastName || ''}`.trim() : undefined,
                    patientType: occupiedAppt ? (occupiedAppt.patientId as any)?.patientType : undefined,
                });

                // Next slot (duration + buffer)
                currentCursorMinutes += slotDuration + bufferMinutes;
            }
        }

        agenda.days.push({ date: currentDayUTC, slots: daySlots });
    }

    return agenda;
};

export const createAtomicAppointment = async (
    tenantId: string,
    professionalId: Types.ObjectId,
    data: {
        patientId: Types.ObjectId;
        startAt: Date;
        endAt: Date;
        duration: number;
        type: string;
        modality: string;
        notes?: string;
        isRecurring: boolean;
        recurringPattern?: {
            frequency: string;
            dayOfWeek?: number;
            interval?: number;
        };
        overrideFrequencyAlert?: boolean;
    }
): Promise<IAppointment> => {
    // 1. Validation Double-Check: Ensure the slot is strictly available right now.
    // Query existing overlapping appointments (excluding cancelled/completed)
    const overlaps = await Appointment.find({
        tenantId,
        professionalId,
        isDeleted: false,
        status: { $in: ['scheduled', 'confirmed', 'pending_confirmation'] },
        $or: [
            { startAt: { $lt: data.endAt, $gte: data.startAt } },
            { endAt: { $gt: data.startAt, $lte: data.endAt } },
            { startAt: { $lte: data.startAt }, endAt: { $gte: data.endAt } }
        ]
    }).lean();

    if (overlaps.length > 0) {
        throw new Error('This slot directly conflicts with another scheduled appointment.');
    }

    // Extrapolate patient info to enforce clinical rules
    const patientObj = await Patient.findOne({ tenantId, _id: data.patientId }).lean() as any;
    if (!patientObj) throw new Error('Patient not found');

    // Validate custom weekly frequencies
    await appointmentService.validateFrequencyPolicy(tenantId, professionalId, patientObj, data.startAt, data.overrideFrequencyAlert);

    // 2. Transact Context: Create atomic Mongoose session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create the primary explicit appointment
        const baseAppointment = new Appointment({
            tenantId,
            professionalId,
            patientId: data.patientId,
            startAt: data.startAt,
            endAt: data.endAt,
            duration: data.duration,
            type: data.type,
            modality: data.modality,
            notes: data.notes,
            isRecurring: data.isRecurring,
            status: 'scheduled',
            createdBy: professionalId,
            reminders: [] // Reminders Cron will fill this later (Out of MVP scope)
        });

        if (data.isRecurring && data.recurringPattern) {
            // Maximum materialization explicitly limited to 52 instances (1 Year max)
            const MAX_INSTANCES = 52;
            const EXPANSION_LIMIT_DATE = new Date(data.startAt);
            EXPANSION_LIMIT_DATE.setUTCFullYear(EXPANSION_LIMIT_DATE.getUTCFullYear() + 1);

            baseAppointment.recurringPattern = {
                frequency: data.recurringPattern.frequency,
                dayOfWeek: data.recurringPattern.dayOfWeek || data.startAt.getUTCDay(),
                interval: data.recurringPattern.interval || 1,
                seriesEndMaterializedAt: EXPANSION_LIMIT_DATE
            };

            await baseAppointment.save({ session });

            // Materialize children
            const children: IAppointment[] = [];
            let currentStart = new Date(data.startAt);
            let currentEnd = new Date(data.endAt);
            let instances = 1;

            while (instances < MAX_INSTANCES) {
                // Advance date by interval logic
                if (data.recurringPattern.frequency === 'weekly') {
                    currentStart.setUTCDate(currentStart.getUTCDate() + (7 * (data.recurringPattern.interval || 1)));
                    currentEnd.setUTCDate(currentEnd.getUTCDate() + (7 * (data.recurringPattern.interval || 1)));
                } else if (data.recurringPattern.frequency === 'monthly') {
                    currentStart.setUTCMonth(currentStart.getUTCMonth() + (data.recurringPattern.interval || 1));
                    currentEnd.setUTCMonth(currentEnd.getUTCMonth() + (data.recurringPattern.interval || 1));
                }

                if (currentStart > EXPANSION_LIMIT_DATE) break;

                children.push(new Appointment({
                    tenantId,
                    professionalId,
                    patientId: data.patientId,
                    startAt: new Date(currentStart),
                    endAt: new Date(currentEnd),
                    duration: data.duration,
                    type: data.type,
                    modality: data.modality,
                    isRecurring: true,
                    status: 'scheduled',
                    recurringPattern: {
                        parentAppointmentId: baseAppointment._id
                    }
                }));

                instances++;
            }

            if (children.length > 0) {
                // Ignore overlaps for future materialized instances (to be handled properly by resolution logic later)
                // Just insert them transactionally
                await Appointment.insertMany(children, { session });
            }

        } else {
            await baseAppointment.save({ session });
        }

        await session.commitTransaction();

        // Fire-and-forget audit (outside transaction)
        logAuditEvent(tenantId, 'Appointment', baseAppointment._id as Types.ObjectId, 'CREATE', professionalId);

        return baseAppointment;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
