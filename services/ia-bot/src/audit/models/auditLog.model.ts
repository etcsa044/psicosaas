import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
    tenantId: string;
    sessionId: string;
    userPhone: string;
    messageDirection: string;
    messageContent: string;
    taskExecuted?: string;
    botResponse?: string;
    keywordMatch?: {
        keyword: string;
        level: string;
        action: string;
    };
    governanceAction?: string;
    latencyMs?: number;
    error?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        tenantId: { type: String, required: true },
        sessionId: { type: String, required: true },
        userPhone: { type: String, required: true },
        messageDirection: { type: String, enum: ['incoming', 'outgoing'], required: true },
        messageContent: { type: String, required: true, maxlength: 5000 },
        taskExecuted: { type: String },
        botResponse: { type: String, maxlength: 5000 },
        keywordMatch: {
            keyword: String,
            level: { type: String, enum: ['prohibited', 'sensitive', 'administrative'] },
            action: String,
        },
        governanceAction: { type: String, enum: ['allowed', 'blocked', 'escalated', 'modified'] },
        latencyMs: { type: Number },
        error: { type: String },
    },
    { timestamps: true }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, sessionId: 1 });
AuditLogSchema.index({ tenantId: 1, userPhone: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, governanceAction: 1 });

export default mongoose.model<IAuditLog>('BotAuditLog', AuditLogSchema);
