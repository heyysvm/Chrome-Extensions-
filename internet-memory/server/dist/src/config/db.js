import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internet-memory';
export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Successfully connected to MongoDB.');
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
