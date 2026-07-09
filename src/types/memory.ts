export type MemoryType = 'photo' | 'video' | 'audio' | 'memo';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title: string;        // Initially user-provided or AI-generated
  description: string;  // Caption, transcript or direct memo content
  date: string;         // YYYY-MM-DD
  mediaUrl: string;     // Base64 Data URL or mock URL
  fileName?: string;
  fileSize?: number;
  aiAnalysis?: {
    tags: string[];
    sentiment: string;
    summary: string;
    suggestedTitle: string;
    analyzedAt: string;
  };
  personaId?: string; // Links this memory to a specific family persona
  createdAt: string;
}
