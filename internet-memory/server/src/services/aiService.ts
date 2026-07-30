import { GoogleGenAI } from '@google/genai';
import type { Summary } from '../../../shared/types/index.js';

export const generateSummary = async (text: string, title: string, apiKey: string): Promise<Summary> => {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the following webpage content. 
    Page Title: "${title}"
    
    Page Content:
    ${text}
    
    Generate:
    1. A short, accurate, structured summary (max 3 sentences).
    2. Relevant concept tags (keywords).
    3. High-level topics (general categories).
    4. Difficulty level ('Beginner', 'Intermediate', or 'Advanced') for the reader.
    5. Estimated reading time in minutes (assuming 200 words per minute).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING' },
            tags: { type: 'ARRAY', items: { type: 'STRING' } },
            topics: { type: 'ARRAY', items: { type: 'STRING' } },
            difficulty: { type: 'STRING', enum: ['Beginner', 'Intermediate', 'Advanced'] },
            readingTime: { type: 'INTEGER' }
          },
          required: ['summary', 'tags', 'topics', 'difficulty', 'readingTime']
        }
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(response.text) as Summary;
  } catch (error) {
    console.error('Failed to generate summary via Gemini:', error);
    // Fallback schema compliance
    return {
      summary: `Failed to compile automated summary. Webpage "${title}" logged successfully.`,
      tags: ['Webpage'],
      topics: ['Browsing History'],
      difficulty: 'Intermediate',
      readingTime: Math.max(1, Math.round(text.length / 1000))
    };
  }
};

export const generateEmbedding = async (text: string, apiKey: string): Promise<number[]> => {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text.slice(0, 8000) // Cap characters for embedding to maintain stable vector lengths
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error('No embedding values returned from Gemini API');
    }

    return response.embeddings[0].values;
  } catch (error) {
    console.error('Failed to generate embedding via Gemini:', error);
    // Fallback to a zeroed 768-dimensional array to keep DB schemas unified
    return new Array(768).fill(0);
  }
};

export const generateChatResponse = async (query: string, context: string, apiKey: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `
        You are the AI Assistant for "Internet Memory", a browser history semantic retrieval tool.
        The user is asking a question about pages they have visited in the past.
        
        Answer the user's question using ONLY the retrieved web page context below.
        If the context does not contain enough details to answer the question, politely say:
        "I couldn't find any information about that in your browser memory."
        
        Do not make up facts or use external knowledge not supported by the context.
        Always refer to the pages by their titles where appropriate.
        
        Retrieved Context:
        ${context}
        
        User Question:
        ${query}
      `
    });

    return response.text || "I couldn't generate an answer from the retrieved memory.";
  } catch (error) {
    console.error('Failed to generate chat response:', error);
    throw error;
  }
};
