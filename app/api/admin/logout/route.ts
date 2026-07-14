import { NextResponse } from "next/server";
import {
  deleteSession,
  getAdminSessionCookie,
  verifyToken,
  clearAdminSessionCookie,
} from "@/lib/auth";

export async function POST() {
  try {
    const token = await getAdminSessionCookie();
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        await deleteSession(token);
      }
      await clearAdminSessionCookie();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json({ error: "登出失败" }, { status: 500 });
  }
}
