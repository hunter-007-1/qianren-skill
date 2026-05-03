import OpenAI from "openai";

export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY 环境变量");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
};

export const getModelName = () => process.env.OPENAI_MODEL || "gpt-4o-mini";
