import type { MemoryType } from './memory';

export interface DocumentaryChapter {
  id: string;
  year: number;
  title: string;
  narrative: string;   // Structured chronological narration connecting memories of this year
  summary: string;     // One-sentence bullet summary
  memories: {
    id: string;
    type: MemoryType;
    title: string;
    mediaUrl?: string;
  }[];
}

export interface Documentary {
  id: string;
  title: string;
  subtitle: string;
  introduction: string;
  chapters: DocumentaryChapter[];
  conclusion: string;
  createdAt: string;
}
