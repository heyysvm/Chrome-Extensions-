import { Schema, model, Types } from 'mongoose';

const summarySchema = new Schema({
  summary: { type: String, required: true },
  tags: [{ type: String }],
  topics: [{ type: String }],
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    default: 'Intermediate' 
  },
  readingTime: { type: Number, default: 0 }
}, { _id: false });

const pageSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  favicon: {
    type: String
  },
  cleanedContent: {
    type: String
  },
  summary: {
    type: summarySchema
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  collectionIds: [{
    type: String
  }],
  embedding: {
    type: [Number],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate pages indexed by the same user
pageSchema.index({ userId: 1, url: 1 }, { unique: true });

export const PageModel = model('Page', pageSchema);
