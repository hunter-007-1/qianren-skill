import { NextResponse } from "next/server";
import {
  loginSchema,
  verifyPassword,
  findUserByEmail,
  createSession,
  setSessionCookie,
} from "@/lib/auth";

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
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}