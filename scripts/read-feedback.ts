import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const feedbackSchema = new mongoose.Schema({}, { strict: false });
const Feedback = mongoose.model('Feedback', feedbackSchema, 'feedbacks');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
        feedbacks.forEach(f => {
            console.log(`\n--- [${f.type}] ${f.status} ---`);
            console.log(`Msg: ${f.message}`);
            console.log(`Page: ${f.page}`);
            console.log(`Date: ${f.createdAt}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
