import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PageModel } from '../models/Page.js';
import { generateEmbedding, generateChatResponse } from '../services/aiService.js';
import { cosineSimilarity } from '../utils/vector.js';

export const chatWithMemory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (!message) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  try {
    const apiKey = (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(400).json({ 
        error: 'Gemini API Key is missing. Configure GEMINI_API_KEY on the server or provide it in the x-gemini-api-key header.' 
      });
      return;
    }

    // 1. Generate search embedding vector for user query
    const queryVector = await generateEmbedding(message, apiKey);

    // 2. Fetch pages, including their embeddings
    const pages = await PageModel.find({ userId }).select('+embedding');

    if (pages.length === 0) {
      res.status(200).json({
        response: "You haven't indexed any pages in your browser memory yet. Try browsing some websites with the extension active first!",
        citations: []
      });
      return;
    }

    // 3. Compute cosine similarity scores
    const scoredPages = pages.map((page: any) => {
      const pageVector = page.embedding;
      let score = 0;

      if (pageVector && pageVector.length === queryVector.length) {
        score = cosineSimilarity(queryVector, pageVector);
      } else {
        const docText = `${page.title} ${page.cleanedContent || ''}`.toLowerCase();
        const queryText = message.toLowerCase();
        score = docText.includes(queryText) ? 0.35 : 0.05;
      }

      return {
        page,
        score
      };
    });

    // 4. Retrieve top 3 matching pages (threshold 0.25)
    const matches = scoredPages
      .filter(item => item.score >= 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (matches.length === 0) {
      res.status(200).json({
        response: "I couldn't find any relevant pages in your browser memory to answer that question.",
        citations: []
      });
      return;
    }

    // 5. Compile context block
    const context = matches
      .map((item, index) => {
        const page = item.page;
        return `[Source ${index + 1}]
Title: ${page.title}
URL: ${page.url}
Summary: ${page.summary?.summary || ''}
Content Snippet: ${(page.cleanedContent || '').slice(0, 1500)}
---`;
      })
      .join('\n\n');

    // 6. Generate answer using Gemini
    const answer = await generateChatResponse(message, context, apiKey);

    // 7. Format citations to return to frontend (strip large cleanedContent)
    const citations = matches.map(item => {
      const pageObj = item.page.toObject();
      delete pageObj.embedding;
      delete pageObj.cleanedContent;
      return pageObj;
    });

    res.status(200).json({
      response: answer,
      citations
    });
  } catch (error) {
    console.error('Failed in chatWithMemory:', error);
    res.status(500).json({ error: 'Internal server error while processing your query.' });
  }
};
