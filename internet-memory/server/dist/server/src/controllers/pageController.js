import { PageModel } from '../models/Page.js';
import { generateSummary, generateEmbedding } from '../services/aiService.js';
import { cosineSimilarity } from '../utils/vector.js';
export const createPage = async (req, res) => {
    const { url, title, favicon, cleanedContent } = req.body;
    if (!url || !title) {
        res.status(400).json({ error: 'URL and title are required.' });
        return;
    }
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized.' });
            return;
        }
        // Resolve Gemini API Key from header or server env fallback
        const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({
                error: 'Gemini API Key is missing. Configure GEMINI_API_KEY on the server or provide it in the x-gemini-api-key header.'
            });
            return;
        }
        // Run AI processing
        const pageText = (cleanedContent || '').trim() || title;
        const aiSummary = await generateSummary(pageText, title, apiKey);
        const embedding = await generateEmbedding(pageText, apiKey);
        // Prevent duplicates by checking if url exists for user. If it does, update it, otherwise create new.
        let page = await PageModel.findOne({ userId, url });
        if (page) {
            page.title = title;
            page.favicon = favicon;
            page.cleanedContent = cleanedContent;
            page.summary = aiSummary;
            page.embedding = embedding;
            page.updatedAt = new Date();
            await page.save();
        }
        else {
            page = new PageModel({
                userId,
                url,
                title,
                favicon,
                cleanedContent,
                summary: aiSummary,
                embedding
            });
            await page.save();
        }
        res.status(201).json(page);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to index page.' });
    }
};
export const getPages = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
    }
    const { pinned, bookmarked, search } = req.query;
    try {
        const query = { userId };
        if (pinned === 'true')
            query.isPinned = true;
        if (bookmarked === 'true')
            query.isBookmarked = true;
        // Resolve Gemini API key for query embedding
        const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (search && apiKey) {
            // 1. Generate query embedding vector
            const queryVector = await generateEmbedding(search, apiKey);
            // 2. Fetch pages, explicitly selecting the hidden embedding array
            const pages = await PageModel.find(query).select('+embedding');
            // 3. Compute cosine similarity score for each page
            const scoredPages = pages.map((page) => {
                const pageVector = page.embedding;
                let score = 0;
                if (pageVector && pageVector.length === queryVector.length) {
                    score = cosineSimilarity(queryVector, pageVector);
                }
                else {
                    // Fallback if page embedding is missing or mismatched size
                    const docText = `${page.title} ${page.cleanedContent || ''}`.toLowerCase();
                    const queryText = search.toLowerCase();
                    score = docText.includes(queryText) ? 0.35 : 0.05;
                }
                const pageObj = page.toObject();
                delete pageObj.embedding; // Remove large float array before sending response
                return {
                    ...pageObj,
                    score
                };
            });
            // 4. Filter out irrelevant records and sort by score descending
            const filtered = scoredPages
                .filter(p => p.score >= 0.25)
                .sort((a, b) => b.score - a.score);
            res.status(200).json(filtered);
        }
        else {
            // Fallback: standard keyword search if query is set but no API credentials exist
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { url: { $regex: search, $options: 'i' } },
                    { cleanedContent: { $regex: search, $options: 'i' } }
                ];
            }
            const pages = await PageModel.find(query).sort({ updatedAt: -1 });
            res.status(200).json(pages);
        }
    }
    catch (error) {
        console.error('Failed to query pages:', error);
        res.status(500).json({ error: 'Failed to retrieve pages.' });
    }
};
export const toggleFavorite = async (req, res) => {
    const { id } = req.params;
    const { isPinned, isBookmarked } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
    }
    try {
        const page = await PageModel.findOne({ _id: id, userId });
        if (!page) {
            res.status(404).json({ error: 'Page not found.' });
            return;
        }
        if (isPinned !== undefined)
            page.isPinned = isPinned;
        if (isBookmarked !== undefined)
            page.isBookmarked = isBookmarked;
        page.updatedAt = new Date();
        await page.save();
        res.status(200).json(page);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update page status.' });
    }
};
export const deletePage = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
    }
    try {
        const page = await PageModel.findOneAndDelete({ _id: id, userId });
        if (!page) {
            res.status(404).json({ error: 'Page not found.' });
            return;
        }
        res.status(200).json({ message: 'Page deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete page.' });
    }
};
