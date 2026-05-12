import { MessageRole, Prisma } from "@prisma/client";
import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { analysisSchema, type AnalysisResult } from "@/lib/types";
import { updateCharacterMemory } from "@/lib/services/memory-service";

const toAnalysisResult = (analysis: {
  persona: Prisma.JsonValue;
  memories: Prisma.JsonValue;
  speakingStyle: Prisma.JsonValue;
  emotionPattern: Prisma.JsonValue;
  relationshipPattern: Prisma.JsonValue;
}): AnalysisResult =>
  analysisSchema.parse({
    persona: analysis.persona,
    memories: analysis.memories,
    speakingStyle: analysis.speakingStyle,
    emotionPattern: analysis.emotionPattern,
    relationshipPattern: analysis.relationshipPattern,
  });

export const generateReply = async (
  characterId: string,
  userMessage: string,
) => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      analysis: true,
      chatMessages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });

  if (!character) {
    throw new Error("角色不存在");
  }

  if (!character.analysis) {
    throw new Error("请先完成人物分析");
  }

  const analysis = toAnalysisResult(character.analysis);
  const model = getModelName();

  const storedUser = await prisma.chatMessage.create({
    data: {
      characterId,
      role: MessageRole.user,
      content: userMessage,
    },
  });

  // 每 10 条消息自动触发记忆更新（异步，不阻塞回复）
  const messageCount = await prisma.chatMessage.count({
    where: { characterId },
  });
  if (messageCount % 10 === 0 && messageCount >= 10) {
    updateCharacterMemory(characterId).catch((err) =>
      console.error("自动记忆更新失败:", err),
    );
  }

  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: buildChatSystemPrompt(analysis, character.nickname),
      },
      ...character.chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ],
    temperature: 0.65,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型未返回内容");
  }

  const assistant = await prisma.chatMessage.create({
    data: {
      characterId,
      role: MessageRole.assistant,
      content,
    },
  });

  return { user: storedUser, assistant };
};

export const regenerateReply = async (characterId: string) => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      analysis: true,
      chatMessages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!character) {
    throw new Error("角色不存在");
  }

  if (!character.analysis) {
    throw new Error("请先完成人物分析");
  }

  const messages = [...character.chatMessages];
  const last = messages.at(-1);
  if (last?.role === MessageRole.assistant) {
    await prisma.chatMessage.delete({ where: { id: last.id } });
    messages.pop();
  }

  const lastUser = messages.at(-1);
  if (!lastUser || lastUser.role !== MessageRole.user) {
    throw new Error("没有可重新生成的用户消息");
  }

  const analysis = toAnalysisResult(character.analysis);
  const client = getOpenAIClient();
  const model = getModelName();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: buildChatSystemPrompt(analysis, character.nickname),
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.65,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型未返回内容");
  }

  return prisma.chatMessage.create({
    data: {
      characterId,
      role: MessageRole.assistant,
      content,
    },
  });
};
