import { ProcessingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseByFileType } from "@/lib/file-parser";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkCharacterLimit } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json([]);
    }

    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        analysisStatus: true,
        createdAt: true,
        characterTags: {
          include: { tag: true },
        },
      },
    });
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ error: "获取列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 检查角色数量限制
    const characterLimit = await checkCharacterLimit(user.id);
    if (!characterLimit.allowed) {
      return NextResponse.json(
        {
          error: `角色数量已达上限（${characterLimit.limit}个），请升级到专业版`,
          current: characterLimit.current,
          limit: characterLimit.limit,
          plan: characterLimit.plan,
        },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();

    const nickname = String(formData.get("nickname") ?? "").trim();
    const relationship =
      String(formData.get("relationship") ?? "").trim() || null;
    const background = String(formData.get("background") ?? "").trim() || null;
    const timeframe = String(formData.get("timeframe") ?? "").trim() || null;
    const impression = String(formData.get("impression") ?? "").trim() || null;
    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;
    const userAvatarUrl =
      String(formData.get("userAvatarUrl") ?? "").trim() || null;
    const pastedText = String(formData.get("pastedText") ?? "").trim();
    const tagIds = formData.getAll("tagIds").filter(Boolean) as string[];

    const rawFiles = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!nickname) {
      return NextResponse.json({ error: "请填写人物昵称" }, { status: 400 });
    }

    const hasSource = rawFiles.length > 0 || pastedText;
    const hasPersona = !!impression;

    if (!hasSource && !hasPersona) {
      return NextResponse.json(
        { error: "请填写主观印象或上传聊天资料" },
        { status: 400 },
      );
    }

    const documents: Array<{
      filename: string;
      fileType: string;
      content: string;
    }> = [];

    for (const file of rawFiles) {
      const raw = await file.text();
      const parsed = parseByFileType(file.name, raw);
      documents.push({
        filename: file.name,
        fileType: file.type || "text/plain",
        content: parsed,
      });
    }

    if (pastedText) {
      documents.push({
        filename: "manual-input.txt",
        fileType: "text/plain",
        content: pastedText,
      });
    }

    // 如果没有聊天资料但有人设信息，自动创建人设文档
    if (documents.length === 0 && impression) {
      const personaContent = [
        nickname && `昵称：${nickname}`,
        relationship && `关系：${relationship}`,
        background && `背景：${background}`,
        timeframe && `时间跨度：${timeframe}`,
        `主观印象：${impression}`,
      ]
        .filter(Boolean)
        .join("\n");

      documents.push({
        filename: "persona-description.txt",
        fileType: "text/plain",
        content: personaContent,
      });
    }

    const character = await prisma.character.create({
      data: {
        nickname,
        relationship,
        background,
        timeframe,
        impression,
        avatarUrl,
        userAvatarUrl,
        userId: user.id,
        parseStatus: ProcessingStatus.DONE,
        sourceDocuments: {
          create: documents,
        },
        characterTags: tagIds.length > 0 ? {
          create: tagIds.map((tagId) => ({ tagId })),
        } : undefined,
      },
      include: { sourceDocuments: true, characterTags: { include: { tag: true } } },
    });

    return NextResponse.json({
      id: character.id,
      parseStatus: character.parseStatus,
      preview: character.sourceDocuments.map((doc) => ({
        filename: doc.filename,
        text: doc.content.slice(0, 600),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传或解析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
