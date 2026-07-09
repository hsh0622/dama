export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'happiness' | 'hardship' | 'legacy' | 'general';
}

export interface InterviewResponse {
  id: string;
  questionId: string;
  questionText: string;
  year: number;         // Year of the interview
  responseType: 'text' | 'voice';
  responseText: string; // Transcribed audio or typed response
  mediaUrl?: string;    // Base64 voice data if audio is recorded and kept
  answeredAt: string;
}
