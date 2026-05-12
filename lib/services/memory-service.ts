import { getModelName, getOpenAIClient } from "@/lib/ai-client";
import { prisma } from "@/lib/db";
import {
  buildMemoryExtractionPrompt,
  buildMemoryAnalysisPrompt,
} from "@/lib/prompts";
import { analysisSchema, type AnalysisResult } from "@/lib/types";

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

function generateMemoryMarkdown(
  memories: {
    content: string;
    category: string;
    importance: number;
    sentiment: string;
    emotionalAnchor?: string | null;
  }[],
  nickname: string,
): string {
  const now = new Date().toLocaleString("zh-CN");
  const grouped: Record<string, typeof memories> = {
    偏好: [],
    事件: [],
    情感: [],
    习惯: [],
    关系: [],
  };

  memories.forEach((m) => {
    const cat = grouped[m.category] ? m.category : "事件";
    grouped[cat].push(m);
  });

  let md = `# ${nickname} 的记忆档案\n\n`;
  md += `> 最后更新: ${now}  \n`;
  md += `> 记忆总数: ${memories.length} 条\n\n`;
  md += `## 记忆概览\n\n`;
  md += `| 分类 | 数量 |\n|------|------|\n`;
  Object.entries(grouped).forEach(([cat, items]) => {
    md += `| ${cat} | ${items.length} |\n`;
  });
  md += `\n## 详细记忆\n\n`;

  Object.entries(grouped).forEach(([cat, items]) => {
    if (items.length > 0) {
      md += `### ${cat}\n\n`;
      items.sort((a, b) => b.importance - a.importance);
      items.forEach((m, i) => {
        const sentimentEmoji =
          m.sentiment === "positive"
            ? "😊"
            : m.sentiment === "negative"
              ? "😔"
              : "😐";
        const anchor = m.emotionalAnchor
          ? ` — 情感印记: ${m.emotionalAnchor}`
          : "";
        md += `${i + 1}. ${sentimentEmoji} ${m.content}  \n`;
        md += `   - 重要性: ${m.importance}/10${anchor}\n`;
      });
      md += `\n`;
    }
  });

  return md;
}

export async function updateCharacterMemory(characterId: string) {
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

  const recentMessages = await prisma.chatMessage.findMany({
    where: { characterId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (recentMessages.length < 5) {
    throw new Error("对话记录不足，至少需要 5 条消息");
  }

  const client = getOpenAIClient();
  const model = getModelName();

  // Step 1: 提取记忆点
  const extractionPrompt = buildMemoryExtractionPrompt(
    recentMessages
      .reverse()
      .map((m) => ({ role: m.role, content: m.content })),
    character.nickname,
  );

  const extractionCompletion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "你是记忆提取助手。请从对话中提取关键记忆点。仅输出纯 JSON。",
      },
      { role: "user", content: extractionPrompt },
    ],
    temperature: 0.3,
  });

  const extractionRaw =
    extractionCompletion.choices[0]?.message?.content ?? "";
  const extractionResult = parseJsonFromModel(extractionRaw);
  const extractedMemories: {
    content: string;
    category: string;
    importance: number;
    emotionalAnchor?: string;
    sentiment: string;
  }[] = extractionResult.memories || [];

  // Step 2: 存入 CharacterMemory 表
  if (extractedMemories.length > 0) {
    await prisma.characterMemory.createMany({
      data: extractedMemories.map((m) => ({
        characterId,
        content: m.content,
        category: m.category || "事件",
        importance: Math.min(10, Math.max(1, m.importance || 5)),
        source: "对话提取",
        emotionalAnchor: m.emotionalAnchor || null,
        sentiment: m.sentiment || "neutral",
      })),
    });
  }

  // Step 3: 获取所有记忆（按重要性排序）
  const allMemories = await prisma.characterMemory.findMany({
    where: { characterId },
    orderBy: { importance: "desc" },
    take: 50,
  });

  // Step 4: 生成 Markdown 记忆文件
  const markdown = generateMemoryMarkdown(
    allMemories.map((m) => ({
      content: m.content,
      category: m.category,
      importance: m.importance,
      sentiment: m.sentiment,
      emotionalAnchor: m.emotionalAnchor,
    })),
    character.nickname,
  );

  // Step 5: 更新或创建记忆文件（SourceDocument）
  const existingMemoryFile = await prisma.sourceDocument.findFirst({
    where: {
      characterId,
      filename: "记忆档案.md",
    },
  });

  if (existingMemoryFile) {
    await prisma.sourceDocument.update({
      where: { id: existingMemoryFile.id },
      data: { content: markdown },
    });
  } else {
    await prisma.sourceDocument.create({
      data: {
        characterId,
        filename: "记忆档案.md",
        fileType: "text/markdown",
        content: markdown,
      },
    });
  }

  // Step 6: 基于记忆重新分析
  const currentAnalysis = analysisSchema.parse({
    persona: character.analysis.persona,
    memories: character.analysis.memories,
    speakingStyle: character.analysis.speakingStyle,
    emotionPattern: character.analysis.emotionPattern,
    relationshipPattern: character.analysis.relationshipPattern,
  });

  const analysisPrompt = buildMemoryAnalysisPrompt(
    allMemories.map((m) => ({
      content: m.content,
      category: m.category,
      importance: m.importance,
    })),
    currentAnalysis,
    character.nickname,
  );

  const analysisCompletion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "你是结构化人物分析助手。请严格按照要求的 JSON 格式输出。",
      },
      { role: "user", content: analysisPrompt },
    ],
    temperature: 0.3,
  });

  const analysisRaw =
    analysisCompletion.choices[0]?.message?.content ?? "";
  const parsedAnalysis = analysisSchema.parse(
    parseJsonFromModel(analysisRaw),
  );

  // Step 7: 更新 Analysis
  await prisma.analysis.update({
    where: { characterId },
    data: {
      persona: parsedAnalysis.persona,
      memories: parsedAnalysis.memories,
      speakingStyle: parsedAnalysis.speakingStyle,
      emotionPattern: parsedAnalysis.emotionPattern,
      relationshipPattern: parsedAnalysis.relationshipPattern,
      lastMemoryUpdate: new Date(),
      memoryVersion: { increment: 1 },
    },
  });

  return {
    memories: extractedMemories,
    analysis: parsedAnalysis,
    memoryCount: allMemories.length,
  };
}
