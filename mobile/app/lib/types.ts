export interface Character {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  userAvatarUrl: string | null;
  relationship: string | null;
  timeframe: string | null;
  background: string | null;
  impression: string | null;
  analysisStatus: "NOT_STARTED" | "RUNNING" | "DONE" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  characterId?: string;
}

export interface AnalysisResult {
  persona: {
    summary: string;
    traits: string[];
  };
  memories: Array<{
    event: string;
    emotionalAnchor?: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  speakingStyle: {
    tone: string[];
    habits: string[];
    samplePhrases: string[];
  };
  emotionPattern: {
    commonEmotions: string[];
    triggers: string[] | { positive: string[]; negative: string[] };
    regulationStyle: string;
  };
}