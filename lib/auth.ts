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
  isAdmin: boolean;
};

const JWT_SECRET = process.env.JWT_SECRET || "qianren-skill-dev-secret-key";
const JWT_EXPIRES_IN = "7d";
const SESSION_COOKIE_NAME = "qianren-session";

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

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, nickname: true, isAdmin: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    isAdmin: user.isAdmin,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
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
    select: { isAdmin: true },
  });
  return user?.isAdmin ?? false;
}