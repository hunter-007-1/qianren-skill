import { AnalysisStatus } from "@prisma/client";
import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import { buildAnalysisPrompt } from "@/lib/prompts";
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
    // 尝试提取第一个 { 和最后一个 } 之间的内容
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

export const runAnalysis = async (characterId: string) => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { sourceDocuments: true },
  });

  if (!character) {
    throw new Error("角色不存在");
  }

  if (character.sourceDocuments.length === 0) {
    throw new Error("请先上传至少一份资料");
  }

  const MAX_CHARACTERS = 100000; // 限制送入模型的原始文本长度约 10w 字
  let totalLength = 0;
  const materials = character.sourceDocuments
    .map((doc) => {
      if (totalLength > MAX_CHARACTERS) return "";
      const content = doc.content.slice(0, MAX_CHARACTERS - totalLength);
      totalLength += content.length;
      return `### ${doc.filename}\n${content}${doc.content.length > content.length ? "\n(内容过长已截断...)" : ""}`;
    })
    .filter(Boolean)
    .join("\n\n");

  await prisma.character.update({
    where: { id: characterId },
    data: { analysisStatus: AnalysisStatus.RUNNING, errorMessage: null },
  });

  try {
    const client = getOpenAIClient();
    const model = getModelName();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "你是结构化人物分析助手。" },
        {
          role: "user",
          content: buildAnalysisPrompt({
            nickname: character.nickname,
            relationship: character.relationship,
            background: character.background,
            timeframe: character.timeframe,
            impression: character.impression,
            materials,
          }),
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = analysisSchema.parse(parseJsonFromModel(raw));

    const analysis = await prisma.analysis.upsert({
      where: { characterId },
      update: {
        persona: parsed.persona,
        memories: parsed.memories,
        speakingStyle: parsed.speakingStyle,
        emotionPattern: parsed.emotionPattern,
        relationshipPattern: parsed.relationshipPattern,
        rawResponse: raw,
        modelName: model,
      },
      create: {
        characterId,
        persona: parsed.persona,
        memories: parsed.memories,
        speakingStyle: parsed.speakingStyle,
        emotionPattern: parsed.emotionPattern,
        relationshipPattern: parsed.relationshipPattern,
        rawResponse: raw,
        modelName: model,
      },
    });

    await prisma.character.update({
      where: { id: characterId },
      data: { analysisStatus: AnalysisStatus.DONE },
    });

    return analysis;
  } catch (error) {
    const message = error instanceof Error ? error.message : "分析失败";

    await prisma.character.update({
      where: { id: characterId },
      data: { analysisStatus: AnalysisStatus.FAILED, errorMessage: message },
    });

    throw new Error(message);
  }
};
