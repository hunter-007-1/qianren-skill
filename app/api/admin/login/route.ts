import { NextResponse } from "next/server";
import {
  loginSchema,
  verifyPassword,
  findUserByEmail,
  createSession,
  setSessionCookie,
  getAdminEmails,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    if (user.isDisabled) {
      return NextResponse.json(
        { error: "账号已被禁用，请联系管理员" },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const adminEmails = getAdminEmails();
    const isAdmin = user.isAdmin || adminEmails.includes(user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "非管理员账号" }, { status: 403 });
    }

    if (!user.isAdmin && adminEmails.includes(user.email)) {
      await prisma.user
        .update({ where: { id: user.id }, data: { isAdmin: true } })
        .catch(() => {});
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createSession(user.id);

    try {
      await setSessionCookie(token);
    } catch (e) {
      console.error("setSessionCookie error:", e);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAdmin: true,
      },
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
