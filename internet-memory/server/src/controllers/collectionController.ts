import { Response } from 'express';
import { CollectionModel } from '../models/Collection.js';
import { AuthRequest } from '../middleware/auth.js';

export const createCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (!name) {
    res.status(400).json({ error: 'Collection name is required.' });
    return;
  }

  try {
    const newCollection = new CollectionModel({
      userId,
      name,
      description,
      pageIds: []
    });

    await newCollection.save();
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collection.' });
  }
};

export const getCollections = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const collections = await CollectionModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve collections.' });
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const collection = await CollectionModel.findOneAndDelete({ _id: id, userId });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    res.status(200).json({ message: 'Collection deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collection.' });
  }
};

export const addPageToCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { pageId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (!pageId) {
    res.status(400).json({ error: 'Page ID is required.' });
    return;
  }

  try {
    const collection = await CollectionModel.findOne({ _id: id, userId });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found.' });
      return;
    }

    if (!collection.pageIds.includes(pageId)) {
      collection.pageIds.push(pageId);
      await collection.save();
    }

    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add page to collection.' });
  }
};
