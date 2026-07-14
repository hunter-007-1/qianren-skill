import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6位"),
  nickname: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export type AuthUser = {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const JWT_SECRET = process.env.JWT_SECRET || "qianren-skill-dev-secret-key";
const JWT_EXPIRES_IN = "7d";
const SESSION_COOKIE_NAME = "qianren-session";
export const ADMIN_SESSION_COOKIE_NAME = "qianren-admin-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = generateToken({ userId });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function deleteUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // 合并 session + user 查询为一次
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          nickname: true,
          avatarUrl: true,
          isAdmin: true,
          isDisabled: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  const user = session.user;
  if (!user || user.isDisabled) return null;

  const adminEmails = getAdminEmails();
  const isAdmin = user.isAdmin || adminEmails.includes(user.email);

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    isAdmin,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getAdminSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

/** 读取管理后台专用会话，不影响前台用户 Cookie */
export async function getCurrentAdmin(): Promise<AuthUser | null> {
  const token = await getAdminSessionCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          nickname: true,
          avatarUrl: true,
          isAdmin: true,
          isDisabled: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  const user = session.user;
  if (!user || user.isDisabled) return null;

  const adminEmails = getAdminEmails();
  const isAdmin = user.isAdmin || adminEmails.includes(user.email);
  if (!isAdmin) return null;

  if (!user.isAdmin && adminEmails.includes(user.email)) {
    prisma.user
      .update({ where: { id: user.id }, data: { isAdmin: true } })
      .catch(() => {});
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    isAdmin: true,
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  nickname?: string;
}) {
  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(data.email);
  
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      nickname: data.nickname,
      isAdmin,
    },
  });
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true, avatarUrl: true, isAdmin: true },
  });

  if (!user) return false;

  if (user.isAdmin) return true;

  const adminEmails = getAdminEmails();
  const isAdminEmail = adminEmails.includes(user.email);

  if (isAdminEmail) {
    prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
    }).catch(() => {});
  }

  return isAdminEmail;
}