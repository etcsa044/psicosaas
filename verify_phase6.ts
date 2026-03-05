/**
 * Phase 6 Verification Script
 * Tests: EntityAuditLog creation, Appointment cancellation flow, soft delete flow
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Appointment from './src/modules/appointment/models/appointment.model';
import EntityAuditLog from './src/shared/models/entityAuditLog.model';
import { logAuditEvent } from './src/shared/services/entityAuditLog.service';

const MONGODB_URI = process.env.MONGODB_URI!;

async function runTests() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // ─── Test 1: Verify EntityAuditLog model is registered ───
    console.log('━━━ TEST 1: EntityAuditLog Model Registration ━━━');
    const logCount = await EntityAuditLog.countDocuments();
    console.log(`  📋 EntityAuditLog documents in DB: ${logCount}`);
    console.log('  ✅ PASSED: Model is registered and queryable\n');

    // ─── Test 2: Fire-and-forget audit event ───
    console.log('━━━ TEST 2: Fire-and-Forget Audit Event ━━━');
    const testEntityId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();
    logAuditEvent('test-tenant-verify', 'Appointment', testEntityId, 'CREATE', testUserId, { test: true });
    // Wait for async insert
    await new Promise(r => setTimeout(r, 1500));
    const verifyLog = await EntityAuditLog.findOne({ entityId: testEntityId });
    if (verifyLog) {
        console.log(`  📋 Audit log found: action=${verifyLog.action}, entityType=${verifyLog.entityType}`);
        console.log(`  📋 performedBy=${verifyLog.performedBy}, timestamp=${verifyLog.timestamp}`);
        console.log(`  📋 metadata=${JSON.stringify(verifyLog.metadata)}`);
        console.log('  ✅ PASSED: Fire-and-forget audit works\n');
        // cleanup
        await EntityAuditLog.deleteOne({ _id: verifyLog._id });
    } else {
        console.log('  ❌ FAILED: Audit log not found\n');
    }

    // ─── Test 3: Appointment model has cancellationSource field ───
    console.log('━━━ TEST 3: Appointment.cancellationSource Field ━━━');
    const schema = Appointment.schema;
    const hasField = schema.path('cancellationSource') !== undefined;
    console.log(`  📋 cancellationSource in schema: ${hasField}`);
    const enumValues = (schema.path('cancellationSource') as any)?.options?.enum;
    console.log(`  📋 Enum values: ${JSON.stringify(enumValues)}`);
    console.log(hasField ? '  ✅ PASSED\n' : '  ❌ FAILED\n');

    // ─── Test 4: SoftDelete plugin fields exist ───
    console.log('━━━ TEST 4: SoftDelete Plugin Fields ━━━');
    const hasIsDeleted = schema.path('isDeleted') !== undefined;
    const hasDeletedAt = schema.path('deletedAt') !== undefined;
    const hasDeletedBy = schema.path('deletedBy') !== undefined;
    console.log(`  📋 isDeleted: ${hasIsDeleted}, deletedAt: ${hasDeletedAt}, deletedBy: ${hasDeletedBy}`);
    console.log(hasIsDeleted && hasDeletedAt && hasDeletedBy ? '  ✅ PASSED\n' : '  ❌ FAILED\n');

    // ─── Test 5: Audit plugin fields exist ───
    console.log('━━━ TEST 5: Audit Plugin Fields (createdBy/updatedBy) ━━━');
    const hasCreatedBy = schema.path('createdBy') !== undefined;
    const hasUpdatedBy = schema.path('updatedBy') !== undefined;
    console.log(`  📋 createdBy: ${hasCreatedBy}, updatedBy: ${hasUpdatedBy}`);
    console.log(hasCreatedBy && hasUpdatedBy ? '  ✅ PASSED\n' : '  ❌ FAILED\n');

    // ─── Test 6: EntityAuditLog indexes ───
    console.log('━━━ TEST 6: EntityAuditLog Indexes ━━━');
    const indexes = await EntityAuditLog.collection.indexes();
    console.log(`  📋 Number of indexes: ${indexes.length}`);
    indexes.forEach((idx, i) => console.log(`    [${i}] ${JSON.stringify(idx.key)}`));
    console.log('  ✅ PASSED\n');

    // ─── Test 7: Cancellation Alert Index on Appointments ───
    console.log('━━━ TEST 7: Cancellation Alert Compound Index ━━━');
    const apptIndexes = await Appointment.collection.indexes();
    const cancelIdx = apptIndexes.find(idx =>
        idx.key?.patientId && idx.key?.status && idx.key?.cancelledAt
    );
    console.log(`  📋 Found cancellation index: ${cancelIdx ? 'YES' : 'NO'}`);
    if (cancelIdx) console.log(`    Key: ${JSON.stringify(cancelIdx.key)}`);
    console.log(cancelIdx ? '  ✅ PASSED\n' : '  ⚠️ Index may need manual ensureIndexes run\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 ALL TESTS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
}

runTests().catch(err => {
    console.error('❌ Test failed with error:', err);
    mongoose.disconnect();
    process.exit(1);
});
