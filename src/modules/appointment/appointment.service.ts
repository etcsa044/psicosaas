import Patient from '@modules/patient/models/patient.model';
import { professionalSettingsService } from '@modules/professional-settings/professionalSettings.service';
import Appointment, { IAppointment } from './models/appointment.model';
import Schedule, { ISchedule } from './models/schedule.model';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@shared/errors/AppError';
import { parsePaginationQuery, buildPaginationResult, PaginationResult } from '@shared/utils/pagination';
import { Types } from 'mongoose';

export class AppointmentService {
    async validateFrequencyPolicy(
        tenantId: string,
        professionalId: Types.ObjectId,
        patient: any,
        startAt: Date,
        overrideFrequencyAlert?: boolean,
        excludeAppointmentId?: Types.ObjectId
    ): Promise<void> {
        const settings = await professionalSettingsService.getOrCreateSettings(tenantId, professionalId);
        const patientType = patient.patientType || 'regular';
        const override = settings.patientTypeOverrides?.get(patientType);
        const effectivePolicy = override?.weeklyFrequencyPolicy ?? settings.defaultRules.weeklyFrequencyPolicy;

        if (effectivePolicy.mode !== 'none') {
            const day = startAt.getUTCDay();
            const diff = startAt.getUTCDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), diff, 0, 0, 0));
            const weekEnd = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), diff + 6, 23, 59, 59, 999));

            const query: any = {
                tenantId,
                patientId: patient._id,
                professionalId,
                startAt: { $gte: weekStart, $lte: weekEnd },
                status: { $nin: ['cancelled', 'no_show'] }
            };
            if (excludeAppointmentId) {
                query._id = { $ne: excludeAppointmentId };
            }

            const weeklyCount = await Appointment.countDocuments(query);
            const maxPerWeek = effectivePolicy.maxPerWeek || 1;

            if (weeklyCount >= maxPerWeek) {
                if (effectivePolicy.mode === 'block') {
                    throw new ForbiddenError(`Policy Block: Patient reached weekly limit of ${maxPerWeek} appointment(s).`);
                } else if (effectivePolicy.mode === 'alert' && !overrideFrequencyAlert) {
                    throw new ConflictError(`Policy Alert: Patient reached weekly limit of ${maxPerWeek} appointment(s).`);
                }
            }
        }
    }

    // ── Appointments ──

    async create(tenantId: string, input: any, userId: Types.ObjectId): Promise<IAppointment> {
        const startAt = new Date(input.startAt || input.startTime);

        const patient = await Patient.findOne({ tenantId, _id: input.patientId }).lean() as any;
        if (!patient) throw new NotFoundError('Patient');

        const professionalId = input.professionalId || userId;

        await this.validateFrequencyPolicy(tenantId, professionalId, patient, startAt, input.overrideFrequencyAlert);

        const settings = await professionalSettingsService.getOrCreateSettings(tenantId, professionalId);
        const durationMins = input.duration || settings.defaultRules.appointmentDurationMinutes || 45;
        const endAt = (input.endAt || input.endTime) ? new Date(input.endAt || input.endTime) : new Date(startAt.getTime() + durationMins * 60000);

        // Check for conflicts
        const conflict = await Appointment.findOne({
            tenantId,
            professionalId,
            status: { $nin: ['cancelled', 'no_show'] },
            $or: [
                { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
            ],
        });
        if (conflict) throw new ConflictError('Time slot conflicts with an existing appointment');

        return Appointment.create({
            tenantId,
            patientId: input.patientId,
            professionalId,
            startAt,
            endAt,
            duration: durationMins,
            type: input.type || 'regular_session',
            modality: input.modality || 'in_person',
            meetingUrl: input.meetingUrl,
            location: input.location,
            reason: input.reason,
            notes: input.notes,
            isRecurring: input.isRecurring || false,
            recurringPattern: input.recurringPattern,
            createdBy: userId,
        });
    }

    async getById(tenantId: string, id: string): Promise<IAppointment> {
        const appointment = await Appointment.findOne({ tenantId, _id: id })
            .populate('patientId', 'personalInfo.firstName personalInfo.lastName personalInfo.phone')
            .lean() as IAppointment | null;
        if (!appointment) throw new NotFoundError('Appointment');
        return appointment;
    }

    async listByDateRange(tenantId: string, query: any): Promise<IAppointment[]> {
        const filter: any = { tenantId };

        if (query.startDate && query.endDate) {
            filter.startAt = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
        } else if (query.startDate) {
            filter.startAt = { $gte: new Date(query.startDate) };
        }
        if (query.professionalId) filter.professionalId = query.professionalId;
        if (query.patientId) filter.patientId = query.patientId;
        if (query.status) filter.status = query.status;

        return Appointment.find(filter)
            .populate('patientId', 'personalInfo.firstName personalInfo.lastName')
            .sort({ startAt: 1 })
            .limit(200)
            .lean() as any;
    }

    async updateStatus(tenantId: string, id: string, status: string, userId: Types.ObjectId, reason?: string): Promise<IAppointment> {
        const appointment = await Appointment.findOne({ tenantId, _id: id });
        if (!appointment) throw new NotFoundError('Appointment');

        appointment.status = status;
        appointment.updatedBy = userId;

        if (status === 'cancelled') {
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = userId;
            if (reason) appointment.cancellationReason = reason;
        }

        await appointment.save();
        return appointment;
    }

    async update(tenantId: string, id: string, input: any, userId: Types.ObjectId): Promise<IAppointment> {
        const appointment = await Appointment.findOne({ tenantId, _id: id });
        if (!appointment) throw new NotFoundError('Appointment');

        if (['completed', 'cancelled'].includes(appointment.status)) {
            throw new ValidationError('Cannot modify a completed or cancelled appointment');
        }

        if (input.startAt || input.startTime) appointment.startAt = new Date(input.startAt || input.startTime);
        if (input.endAt || input.endTime) appointment.endAt = new Date(input.endAt || input.endTime);
        if (input.duration) appointment.duration = input.duration;
        if (input.type) appointment.type = input.type;
        if (input.modality) appointment.modality = input.modality;
        if (input.meetingUrl !== undefined) appointment.meetingUrl = input.meetingUrl;
        if (input.notes !== undefined) appointment.notes = input.notes;
        if (input.reason !== undefined) appointment.reason = input.reason;

        appointment.updatedBy = userId;
        await appointment.save();
        return appointment;
    }

    async reschedule(tenantId: string, id: string, newStartUTC: string, userId: Types.ObjectId, overrideFrequencyAlert?: boolean): Promise<IAppointment> {
        const appointment = await Appointment.findOne({ tenantId, _id: id });
        if (!appointment) throw new NotFoundError('Appointment');

        if (['completed', 'cancelled'].includes(appointment.status)) {
            throw new ValidationError('Cannot modify a completed or cancelled appointment');
        }

        const startAt = new Date(newStartUTC);
        const durationMins = appointment.duration;
        const endAt = new Date(startAt.getTime() + durationMins * 60000);

        const patient = await Patient.findOne({ tenantId, _id: appointment.patientId }).lean() as any;
        if (!patient) throw new NotFoundError('Patient');

        // Reuse identical validation engine
        await this.validateFrequencyPolicy(tenantId, appointment.professionalId, patient, startAt, overrideFrequencyAlert, appointment._id as Types.ObjectId);

        // Conflict check
        const conflict = await Appointment.findOne({
            tenantId,
            professionalId: appointment.professionalId,
            _id: { $ne: appointment._id },
            status: { $nin: ['cancelled', 'no_show'] },
            $or: [
                { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
            ],
        });
        if (conflict) throw new ConflictError('Time slot conflicts with an existing appointment');

        appointment.startAt = startAt;
        appointment.endAt = endAt;
        appointment.updatedBy = userId;

        await appointment.save();
        return appointment;
    }

    // ── Availability ──

    async getAvailableSlots(tenantId: string, professionalId: string, date: string): Promise<string[]> {
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();

        const schedule = await Schedule.findOne({
            tenantId,
            professionalId,
            dayOfWeek,
            isActive: true,
        });
        if (!schedule) return [];

        // Check if it's a vacation day
        const isVacation = schedule.vacations.some(
            (v) => targetDate >= v.startDate && targetDate <= v.endDate
        );
        if (isVacation) return [];

        // Generate all possible slots
        const slots = this.generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);

        // Filter blocked slots
        const blocked = schedule.blockedSlots
            .filter((b) => b.date.toDateString() === targetDate.toDateString())
            .map((b) => ({ start: b.startTime, end: b.endTime }));

        // Get existing appointments for that day
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            tenantId,
            professionalId,
            startTime: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled', 'no_show'] },
        }).lean();

        // Filter out taken slots
        return slots.filter((slot) => {
            const slotStart = slot;
            const slotEnd = this.addMinutes(slot, schedule.slotDuration);

            const isBlocked = blocked.some((b) => slotStart < b.end && slotEnd > b.start);
            if (isBlocked) return false;

            const isTaken = appointments.some((a: any) => {
                const aStart = this.timeFromDate(a.startTime);
                const aEnd = this.timeFromDate(a.endTime);
                return slotStart < aEnd && slotEnd > aStart;
            });
            return !isTaken;
        });
    }

    private generateTimeSlots(start: string, end: string, duration: number): string[] {
        const slots: string[] = [];
        let current = start;
        while (current < end) {
            slots.push(current);
            current = this.addMinutes(current, duration);
        }
        return slots;
    }

    private addMinutes(time: string, minutes: number): string {
        const [h, m] = time.split(':').map(Number);
        const total = h * 60 + m + minutes;
        const nh = Math.floor(total / 60);
        const nm = total % 60;
        return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    }

    private timeFromDate(date: Date): string {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // ── Schedule Management ──

    async getSchedule(tenantId: string, professionalId: string): Promise<ISchedule[]> {
        return Schedule.find({ tenantId, professionalId }).sort({ dayOfWeek: 1 }).lean() as any;
    }

    async upsertSchedule(tenantId: string, professionalId: string, input: any): Promise<ISchedule> {
        return Schedule.findOneAndUpdate(
            { tenantId, professionalId, dayOfWeek: input.dayOfWeek },
            {
                tenantId,
                professionalId,
                ...input,
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
        ) as any;
    }

    async blockSlot(tenantId: string, professionalId: string, slot: any): Promise<ISchedule> {
        const schedule = await Schedule.findOne({ tenantId, professionalId, dayOfWeek: new Date(slot.date).getDay() });
        if (!schedule) throw new NotFoundError('Schedule for that day');

        schedule.blockedSlots.push({
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            reason: slot.reason,
        });
        await schedule.save();
        return schedule;
    }

    async addVacation(tenantId: string, professionalId: string, vacation: any): Promise<void> {
        await Schedule.updateMany(
            { tenantId, professionalId },
            { $push: { vacations: { startDate: new Date(vacation.startDate), endDate: new Date(vacation.endDate), reason: vacation.reason } } }
        );
    }
}

export const appointmentService = new AppointmentService();
