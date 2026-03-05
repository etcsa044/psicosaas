import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psicosaas');
        const db = mongoose.connection.db!;

        const result = await db.collection('professionalsettings').updateMany(
            { 'defaultRules.cancellationAlertThreshold': null },
            { $set: { 'defaultRules.cancellationAlertThreshold': 3 } }
        );

        console.log(`Updated ${result.modifiedCount} settings documents to have threshold 3.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
