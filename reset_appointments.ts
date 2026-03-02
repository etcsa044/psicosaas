import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

/**
 * GOAL: Start with a clean appointments dataset while preserving patients and professionals.
 * 
 * - Delete ALL records from the appointments table safely.
 * - Idempotent execution.
 */
async function resetAppointments() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;

    if (!db) {
        console.error('Database connection failed');
        process.exit(1);
    }

    console.log('Initiating appointment reset...');
    try {
        const result = await db.collection('appointments').deleteMany({});
        console.log(`✅ Appointment reset complete. Deleted ${result.deletedCount} appointments.`);
    } catch (error) {
        console.error(`❌ Failed to reset appointments: ${error}`);
    }

    process.exit(0);
}

resetAppointments();
