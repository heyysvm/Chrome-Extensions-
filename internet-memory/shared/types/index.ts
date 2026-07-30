export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Summary {
  summary: string;
  tags: string[];
  topics: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime: number; // in minutes
}

export interface Page {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  cleanedContent?: string;
  summary?: Summary;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isBookmarked: boolean;
  collectionIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  pageIds: string[];
  createdAt: string;
}

export interface TimelineGroup {
  dateLabel: string; // e.g. "Today", "Yesterday", "Last Week"
  pages: Page[];
}

export interface SearchResult {
  page: Page;
  score: number; // Semantic relevance score
  matches: {
    key: string;
    snippet: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Page[]; // Retrievable pages used as RAG source
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  excludedWebsites: string[];
  apiKeyEnabled: boolean;
  apiKey?: string;
  syncEnabled: boolean;
  incognitoIndexing: boolean;
}
