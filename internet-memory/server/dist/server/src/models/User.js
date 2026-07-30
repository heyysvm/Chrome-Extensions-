import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        trim: true
    },
    apiKey: {
        type: String,
        unique: true,
        default: () => 'im_key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
export const UserModel = model('User', userSchema);
