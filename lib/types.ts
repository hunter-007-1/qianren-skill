import { z } from "zod";

export const analysisSchema = z.object({
  persona: z.object({
    summary: z.string().default("暂无摘要"),
    traits: z.array(z.string()).default([]),
  }),
  memories: z
    .array(
      z.object({
        event: z.string(),
        emotionalAnchor: z.string().optional().default(""),
        sentiment: z
          .enum(["positive", "neutral", "negative"])
          .optional()
          .default("neutral"),
      }),
    )
    .default([]),
  speakingStyle: z.object({
    tone: z.array(z.string()).default([]),
    habits: z.array(z.string()).default([]),
    samplePhrases: z.array(z.string()).default([]),
    emojiUsage: z
      .enum(["none", "rare", "moderate", "frequent", "very_frequent"])
      .optional()
      .default("moderate"),
    responseSpeed: z
      .enum(["slow", "delayed", "normal", "quick", "immediate"])
      .optional()
      .default("normal"),
  }),
  emotionPattern: z.object({
    commonEmotions: z.array(z.string()).default([]),
    triggers: z
      .union([
        z.array(z.string()),
        z.object({
          positive: z.array(z.string()).default([]),
          negative: z.array(z.string()).default([]),
        }),
      ])
      .default({ positive: [], negative: [] }),
    regulationStyle: z.string().default("未知"),
    emotionalExpressiveness: z
      .enum(["reserved", "moderate", "expressive"])
      .optional()
      .default("moderate"),
  }),
  relationshipPattern: z.object({
    attachmentStyle: z.string().default("未知"),
    interactionDynamics: z.array(z.string()).default([]),
    boundaries: z.array(z.string()).default([]),
    conflictStyle: z.string().optional().default("未知"),
    careExpression: z.string().optional().default("未知"),
  }),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export interface SourceDocument {
  id: string;
  filename: string;
  fileType: string;
  content: string;
  createdAt: Date | string;
}

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
  createdAt: Date | string;
  updatedAt: Date | string;
  sourceDocuments?: SourceDocument[];
  analysis?: (AnalysisResult & { id: string; modelName: string }) | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
}
