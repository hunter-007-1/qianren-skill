import { NextResponse } from "next/server";
import {
  registerSchema,
  hashPassword,
  findUserByEmail,
  createUser,
  setSessionCookie,
  createSession,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const { email, password, nickname } = result.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      nickname: nickname || email.split("@")[0],
    });

    const token = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}