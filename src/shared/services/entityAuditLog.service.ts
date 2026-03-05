import { Types } from 'mongoose';
import EntityAuditLog from '@shared/models/entityAuditLog.model';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';

/**
 * Fire-and-forget audit event logger.
 * 
 * Inserts an immutable record into EntityAuditLog.
 * Errors are caught and logged silently — audit failures
 * must NEVER block the main business flow.
 */
export function logAuditEvent(
    tenantId: string,
    entityType: string,
    entityId: Types.ObjectId,
    action: AuditAction,
    performedBy: Types.ObjectId,
    metadata?: Record<string, any>
): void {
    EntityAuditLog.create({
        tenantId,
        entityType,
        entityId,
        action,
        performedBy,
        metadata,
    }).catch((err) => {
        console.error('[AuditLog] Failed to write audit event:', err.message);
    });
}
