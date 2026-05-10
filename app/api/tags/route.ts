import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { characters: true } },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const existing = await prisma.tag.findUnique({
      where: { userId_name: { userId: user.id, name: name.trim() } },
    });

    if (existing) {
      return NextResponse.json({ error: "标签已存在" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || "#6366f1",
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "标签 ID 不能为空" }, { status: 400 });
    }

    const tag = await prisma.tag.findFirst({
      where: { id, userId: user.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "删除标签失败" }, { status: 500 });
  }
}
