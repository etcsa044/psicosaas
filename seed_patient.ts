import mongoose from 'mongoose';
import Patient from './src/modules/patient/models/patient.model';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;

    // Bypass plugin manually just to get tenantId
    const userDoc = await db?.collection('users').findOne({ email: 'test@test.com' });
    if (!userDoc) process.exit(1);

    const tenantId = userDoc.tenantId;

    await db?.collection('patients').deleteMany({ tenantId });

    // Use raw inserting to avoid plugins if necessary, or just standard model bypassing
    const mockPatients = [
        {
            tenantId, patientType: 'regular', status: 'active', isDeleted: false,
            createdAt: new Date(), updatedAt: new Date(),
            personalInfo: { firstName: 'Juan', lastName: 'Pérez', phone: '+549111234501' }
        },
        {
            tenantId, patientType: 'intensive', status: 'active', isDeleted: false,
            createdAt: new Date(), updatedAt: new Date(),
            personalInfo: { firstName: 'María', lastName: 'Gómez', phone: '+549111234502' }
        },
        {
            tenantId, patientType: 'vip', status: 'active', isDeleted: false,
            createdAt: new Date(), updatedAt: new Date(),
            personalInfo: { firstName: 'Carlos', lastName: 'López', phone: '+549111234503' }
        },
        {
            tenantId, patientType: 'regular', status: 'active', isDeleted: false,
            createdAt: new Date(), updatedAt: new Date(),
            personalInfo: { firstName: 'Ana', lastName: 'Martínez', phone: '+549111234504' }
        },
        {
            tenantId, patientType: 'intensive', status: 'active', isDeleted: false,
            createdAt: new Date(), updatedAt: new Date(),
            personalInfo: { firstName: 'Pedro', lastName: 'García', phone: '+549111234505' }
        }
    ];

    const result = await db?.collection('patients').insertMany(mockPatients);

    console.log(`✅ Seeded ${result?.insertedCount} mock patients for testing.`);
    if (result?.insertedIds) {
        Object.values(result.insertedIds).forEach((id, index) => {
            console.log(`PATIENT_${index}: { id: "${id}", name: "${mockPatients[index].personalInfo.firstName} ${mockPatients[index].personalInfo.lastName}" }`);
        });
    }

    process.exit(0);
}

seed();
