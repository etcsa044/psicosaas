import mongoose from 'mongoose';
import AvailabilityPattern from './src/modules/availability/models/availabilityPattern.model';
import User from './src/modules/auth/models/user.model';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const userDoc = await mongoose.connection.db?.collection('users').findOne({ email: 'test@test.com' });
    if (!userDoc) {
        console.log('User not found');
        process.exit(1);
    }

    const tenantId = userDoc.tenantId;
    const professionalId = userDoc._id;

    await AvailabilityPattern.deleteMany({ tenantId, professionalId });

    for (let i = 1; i <= 5; i++) {
        await AvailabilityPattern.create({
            tenantId,
            professionalId,
            dayOfWeek: i, // Lunes a Viernes
            startMinutes: 540, // 09:00
            endMinutes: 1080, // 18:00
            bufferMinutes: 5,
        });
    }

    console.log('✅ Temporary Availability Patterns seeded successfully');
    process.exit(0);
}

seed();
