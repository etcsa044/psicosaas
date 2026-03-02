import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psicosaas').then(async () => {
    const db = mongoose.connection.db!;
    const users = await db.collection('users').find().toArray();
    console.log("Users:", users.map(u => ({ id: u._id, tenantId: u.tenantId })));
    const patterns = await db.collection('availabilitypatterns').find().toArray();
    console.log("Patterns:", patterns.map(p => ({ proId: p.professionalId, tenId: p.tenantId, day: p.dayOfWeek })));
    process.exit(0);
});
