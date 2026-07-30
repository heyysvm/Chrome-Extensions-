import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PageModel } from '../models/Page.js';

export const getUserAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const pages = await PageModel.find({ userId });

    // Initial values
    let totalPages = pages.length;
    let totalReadingTime = 0;
    const difficultyDistribution = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0
    };

    const tagCounts: { [key: string]: number } = {};
    const activityWeekly = new Array(7).fill(0); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    pages.forEach((page: any) => {
      // 1. Reading Time
      if (page.summary?.readingTime) {
        totalReadingTime += page.summary.readingTime;
      }

      // 2. Difficulty Distribution
      const diff = page.summary?.difficulty;
      if (diff === 'Beginner') {
        difficultyDistribution.Beginner++;
      } else if (diff === 'Intermediate') {
        difficultyDistribution.Intermediate++;
      } else if (diff === 'Advanced') {
        difficultyDistribution.Advanced++;
      } else {
        difficultyDistribution.Beginner++;
      }

      // 3. Tag Counts
      if (page.summary?.tags && Array.isArray(page.summary.tags)) {
        page.summary.tags.forEach((tag: string) => {
          const cleanTag = tag.trim();
          if (cleanTag) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }

      // 4. Weekly Activity (based on createdAt)
      if (page.createdAt) {
        const day = new Date(page.createdAt).getDay();
        activityWeekly[day]++;
      }
    });

    // Format tags array sorted by frequency
    const topTags = Object.keys(tagCounts)
      .map(name => ({ name, count: tagCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Return top 10 tags

    res.status(200).json({
      totalPages,
      totalReadingTime,
      difficultyDistribution,
      topTags,
      activityWeekly
    });
  } catch (error) {
    console.error('Failed to aggregate analytics:', error);
    res.status(500).json({ error: 'Failed to aggregate user analytics.' });
  }
};
