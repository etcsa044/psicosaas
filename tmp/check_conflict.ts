import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function analyze() {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected.');

    const tenantId = 'test-tenant'; // We need the real tenantId. Let's find out what it is in the DB.
    
    const db = mongoose.connection.db;
    
    // Get a user
    const users = await db?.collection('users').find({}).toArray();
    if (!users || users.length === 0) {
        console.log('No users found.');
        process.exit(1);
    }
    const user = users[0];
    const realTenantId = user.tenantId;
    const professionalId = user._id;

    console.log(`Using Tenant: ${realTenantId}, Professional: ${professionalId}`);

    // Let's get the schedule
    const schedules = await db?.collection('schedules').find({ tenantId: realTenantId, professionalId: professionalId, isActive: true }).toArray();
    console.log('Active Schedules:');
    schedules?.forEach(s => {
        console.log(`  Day ${s.dayOfWeek}: ${s.slots.map((sl: any) => `${sl.startTime}-${sl.endTime}`).join(', ')}`);
    });

    // Let's test today's date + 1 hour
    const now = new Date();
    const startAt = new Date(now);
    startAt.setHours(now.getHours() + 1);
    startAt.setMinutes(0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setMinutes(startAt.getMinutes() + 50);

    console.log(`\nTesting StartAt: ${startAt.toISOString()} (Local: ${startAt.toString()})`);
    console.log(`Testing EndAt:   ${endAt.toISOString()}`);

    const existingApp = await db?.collection('appointments').findOne({
        tenantId: realTenantId,
        professionalId: professionalId,
        status: { $nin: ['cancelled', 'no_show'] },
        startAt: { $lt: endAt },
        endAt: { $gt: startAt }
    });

    console.log(`Existing App Conflict:`, existingApp ? `YES (_id: ${existingApp._id})` : 'NO');

    const dayOfWeek = startAt.getUTCDay();
    const localDayOfWeek = startAt.getDay();
    console.log(`Day Of Week (UTC): ${dayOfWeek}`);
    console.log(`Day Of Week (Local): ${localDayOfWeek}`);

    const schedule = await db?.collection('schedules').findOne({
        tenantId: realTenantId,
        professionalId: professionalId,
        dayOfWeek: dayOfWeek,
        isActive: true,
    });

    console.log(`Schedule Found for UTC day ${dayOfWeek}:`, schedule ? 'YES' : 'NO');

    const localSchedule = await db?.collection('schedules').findOne({
        tenantId: realTenantId,
        professionalId: professionalId,
        dayOfWeek: localDayOfWeek,
        isActive: true,
    });
    
    console.log(`Schedule Found for Local day ${localDayOfWeek}:`, localSchedule ? 'YES' : 'NO');

    process.exit(0);
}

analyze().catch(console.error);
