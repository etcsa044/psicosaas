import { Schema, Query } from 'mongoose';

export function softDeletePlugin(schema: Schema): void {
    schema.add({
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    });

    // Auto-exclude soft-deleted documents from find queries
    schema.pre(/^find/, function (this: Query<any, any>) {
        const query = this.getQuery();
        // Allow explicit queries for deleted items
        if (query.isDeleted !== undefined) return;
        this.where({ isDeleted: false });
    });

    // Add softDelete method to documents
    schema.methods.softDelete = function (deletedById?: string) {
        this.isDeleted = true;
        this.deletedAt = new Date();
        if (deletedById) this.deletedBy = deletedById;
        return this.save();
    };

    // Add restore method
    schema.methods.restore = function () {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };
}
