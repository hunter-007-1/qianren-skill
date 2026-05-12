import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import { buildMemoryUpdatePrompt } from "@/lib/prompts";
import { analysisSchema } from "@/lib/types";

const parseJsonFromModel = (output: string) => {
  try {
    const cleaned = output
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON 解析失败，原始输出内容：", output);
    const match = output.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        console.error("尝试提取 JSON 块后依然解析失败：", match[0]);
        throw new Error("模型返回的 JSON 格式不完整或包含非法字符");
      }
    }
    throw new Error("模型返回的不是有效的 JSON 格式");
  }
};

export async function updateCharacterMemory(characterId: string) {
  // 1. 获取角色和当前分析
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { analysis: true },
  });

  if (!character) {
    throw new Error("角色不存在");
  }

  if (!character.analysis) {
    throw new Error("请先完成人物分析");
  }

  // 2. 获取最近 50 条消息
  const recentMessages = await prisma.chatMessage.findMany({
    where: { characterId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (recentMessages.length < 5) {
    throw new Error("对话记录不足，至少需要 5 条消息");
  }

  // 3. 构建当前分析对象（使用 Zod 验证类型）
  const currentAnalysis = analysisSchema.parse({
    persona: character.analysis.persona,
    memories: character.analysis.memories,
    speakingStyle: character.analysis.speakingStyle,
    emotionPattern: character.analysis.emotionPattern,
    relationshipPattern: character.analysis.relationshipPattern,
  });

  // 4. 构建 prompt
  const prompt = buildMemoryUpdatePrompt(
    currentAnalysis,
    recentMessages.reverse().map((m) => ({ role: m.role, content: m.content })),
    character.nickname,
  );

  // 5. 调用 LLM
  const client = getOpenAIClient();
  const model = getModelName();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "你是结构化人物分析助手。请严格按照要求的 JSON 格式输出。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = analysisSchema.parse(parseJsonFromModel(raw));

  // 6. 更新数据库
  await prisma.analysis.update({
    where: { characterId },
    data: {
      persona: parsed.persona,
      memories: parsed.memories,
      speakingStyle: parsed.speakingStyle,
      emotionPattern: parsed.emotionPattern,
      relationshipPattern: parsed.relationshipPattern,
    },
  });

  return parsed;
}
