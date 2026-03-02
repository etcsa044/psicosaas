import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psicosaas');
        const db = mongoose.connection.db!;

        // Get test@test.com user and their tenant
        const user = await db.collection('users').findOne({ email: 'test@test.com' });
        if (!user) {
            console.log('No user found. Please register a user first.');
            process.exit(1);
        }

        const tenantId = user.tenantId;
        const professionalId = user._id;

        // Clear old patterns for this user
        await db.collection('availabilitypatterns').deleteMany({ tenantId, professionalId });

        // Create Mon-Fri 09:00 to 18:00
        const patterns = [];
        for (let day = 1; day <= 5; day++) {
            patterns.push({
                tenantId,
                professionalId,
                dayOfWeek: day,
                startMinutes: 540, // 09:00
                endMinutes: 1080,  // 18:00
                slotDuration: 50,
                bufferMinutes: 10,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await db.collection('availabilitypatterns').insertMany(patterns);

        // Create a dummy patient if not exists
        let patient = await db.collection('patients').findOne({ tenantId });
        let patientId;
        if (!patient) {
            const result = await db.collection('patients').insertOne({
                tenantId,
                firstName: 'Paciente',
                lastName: 'Demo',
                email: 'paciente@demo.com',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            patientId = result.insertedId;
        } else {
            patientId = patient._id;
        }

        console.log(`Seed completo!`);
        console.log(`TenantId: ${tenantId}`);
        console.log(`ProfessionalId: ${professionalId}`);
        console.log(`Dummy PatientId: ${patientId}`);
        process.exit(0);
    } catch (error) {
        console.error('Error in seed:', error);
        process.exit(1);
    }
};

run();
