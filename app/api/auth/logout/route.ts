import { NextResponse } from "next/server";
import {
  deleteSession,
  getSessionCookie,
  verifyToken,
  clearSessionCookie,
} from "@/lib/auth";

export async function POST() {
  try {
    const token = await getSessionCookie();
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        await deleteSession(token);
      }
      await clearSessionCookie();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "登出失败" },
      { status: 500 }
    );
  }
}