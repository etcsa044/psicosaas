import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const patients = [
    { patientType: 'semanal', personalInfo: { firstName: 'Lucía', lastName: 'García', phone: '+5491143210001', email: 'lucia.garcia@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Martín', lastName: 'Rodríguez', phone: '+5491143210002', email: 'martin.rodriguez@demomail.com' }, status: 'active' },
    { patientType: 'quincenal', personalInfo: { firstName: 'Sofía', lastName: 'Martínez', phone: '+5491143210003', email: 'sofia.martinez@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Carlos', lastName: 'López', phone: '+5491143210004', email: 'carlos.lopez@demomail.com' }, status: 'active' },
    { patientType: 'mensual', personalInfo: { firstName: 'Ana', lastName: 'Fernández', phone: '+5491143210005', email: 'ana.fernandez@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Diego', lastName: 'González', phone: '+5491143210006', email: 'diego.gonzalez@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Valentina', lastName: 'Pérez', phone: '+5491143210007', email: 'valentina.perez@demomail.com' }, status: 'active' },
    { patientType: 'quincenal', personalInfo: { firstName: 'Joaquín', lastName: 'Sánchez', phone: '+5491143210008', email: 'joaquin.sanchez@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Camila', lastName: 'Romero', phone: '+5491143210009', email: 'camila.romero@demomail.com' }, status: 'active' },
    { patientType: 'semanal', personalInfo: { firstName: 'Mateo', lastName: 'Díaz', phone: '+5491143210010', email: 'mateo.diaz@demomail.com' }, status: 'active' }
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psicosaas');
        const db = mongoose.connection.db!;

        const user = await db.collection('users').findOne({ email: 'test@test.com' });
        if (!user) {
            console.log('No user found');
            process.exit(1);
        }

        const tenantId = user.tenantId;
        const professionalId = user._id;

        console.log(`Clearing existing patients for tenant ${tenantId}...`);
        await db.collection('patients').deleteMany({ tenantId });

        console.log('Inserting 10 demo patients...');
        const patientsToInsert = patients.map(p => ({
            ...p,
            tenantId,
            createdBy: professionalId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await db.collection('patients').insertMany(patientsToInsert);

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error in seed:', error);
        process.exit(1);
    }
};

run();
