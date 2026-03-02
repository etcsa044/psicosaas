import { Schema, Query } from 'mongoose';

export interface ITenantDocument {
    tenantId: string;
}

export function tenantPlugin(schema: Schema): void {
    schema.add({
        tenantId: {
            type: String,
            required: [true, 'tenantId is required'],
            index: true,
        },
    });

    // Auto-filter by tenantId on all find queries
    const findHooks = [
        'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
        'countDocuments', 'estimatedDocumentCount', 'distinct',
    ] as const;

    for (const hook of findHooks) {
        schema.pre(hook as any, function (this: Query<any, any>) {
            const query = this.getQuery();
            // Allow platform-level queries by explicitly setting _skipTenantCheck
            const opts = this.getOptions?.() || {};
            if (opts._skipTenantCheck || (this as any)._skipTenantCheck) return;
            if (!query.tenantId) {
                throw new Error(`Query on ${this.model?.modelName || 'unknown'} without tenantId is prohibited`);
            }
        });
    }
}
