import { Schema, model } from 'mongoose';

const collectionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  pageIds: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const CollectionModel = model('Collection', collectionSchema);
