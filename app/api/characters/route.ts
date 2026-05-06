import { ProcessingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseByFileType } from "@/lib/file-parser";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

    const rawFiles = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!nickname) {
      return NextResponse.json({ error: "请填写人物昵称" }, { status: 400 });
    }

    if (rawFiles.length === 0 && !pastedText) {
      return NextResponse.json(
        { error: "请上传文件或粘贴文本" },
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
      },
      include: { sourceDocuments: true },
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
