import { Schema } from 'mongoose';

export function auditPlugin(schema: Schema): void {
    schema.add({
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    });

    // timestamps: true is set at schema level, this plugin adds user tracking
}
