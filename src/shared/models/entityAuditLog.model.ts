import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEntityAuditLog extends Document {
    tenantId: string;
    entityType: string;
    entityId: Types.ObjectId;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';
    performedBy: Types.ObjectId;
    timestamp: Date;
    metadata?: Record<string, any>;
}

const EntityAuditLogSchema = new Schema<IEntityAuditLog>(
    {
        tenantId: { type: String, required: true },
        entityType: {
            type: String,
            enum: ['Appointment', 'Patient'], // Extensible: add 'ClinicalEntry', etc.
            required: true,
        },
        entityId: { type: Schema.Types.ObjectId, required: true },
        action: {
            type: String,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'CANCEL'],
            required: true,
        },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: () => new Date() },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: false } // We use our own `timestamp` field
);

// Optimized compound index for querying audit trails by entity
EntityAuditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1, timestamp: -1 });
// Secondary index for querying by performer
EntityAuditLogSchema.index({ tenantId: 1, performedBy: 1, timestamp: -1 });

export default mongoose.model<IEntityAuditLog>('EntityAuditLog', EntityAuditLogSchema);
