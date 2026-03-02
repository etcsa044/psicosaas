import mongoose, { Schema, Document, Types } from 'mongoose';
import { tenantPlugin } from '@shared/plugins/tenant.plugin';

export interface IRoleAuditEntry {
    action: 'created' | 'updated' | 'permissions_changed';
    performedBy: Types.ObjectId;
    performedAt: Date;
    changes?: {
        added: string[];
        removed: string[];
    };
}

export interface IRole extends Document {
    tenantId: string;
    name: string;
    isSystem: boolean;
    description: string;
    permissions: string[];
    auditTrail: IRoleAuditEntry[];
}

const RoleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true,
        },
        isSystem: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            maxlength: 300,
            default: '',
        },
        permissions: [
            {
                type: String,
                uppercase: true,
            },
        ],
        auditTrail: [
            {
                action: {
                    type: String,
                    enum: ['created', 'updated', 'permissions_changed'],
                    required: true,
                },
                performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                performedAt: { type: Date, default: Date.now },
                changes: {
                    added: [String],
                    removed: [String],
                },
            },
        ],
    },
    { timestamps: true }
);

RoleSchema.plugin(tenantPlugin);
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Prevent deletion of system roles
RoleSchema.pre('findOneAndDelete', async function () {
    const role = await this.model.findOne(this.getQuery()).lean();
    if (role && (role as any).isSystem) {
        throw new Error('System roles cannot be deleted');
    }
});

export default mongoose.model<IRole>('Role', RoleSchema);
