import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';
export const register = async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: 'User with this email already exists.' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            email,
            password: hashedPassword,
            name
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                apiKey: newUser.apiKey,
                createdAt: newUser.createdAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to register user.' });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                apiKey: user.apiKey,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to login.' });
    }
};
export const getMe = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
    }
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.status(200).json({
            id: user._id,
            email: user.email,
            name: user.name,
            apiKey: user.apiKey,
            createdAt: user.createdAt
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
};
