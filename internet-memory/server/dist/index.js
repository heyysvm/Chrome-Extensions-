import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Connect Database
connectDB();
// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger clean HTML payloads
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/collections', collectionRoutes);
// Base Status Route
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', service: 'Internet Memory Backend API' });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Internet Memory Backend API Server is running on port ${PORT}`);
});
