import { prisma } from "@/lib/db";

export interface PlanLimits {
  characters: number;
  chatPerDay: number;
  analysisPerDay: number;
  memoryPerDay: number;
  exportPerDay: number;
  model: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    characters: 3,
    chatPerDay: 20,
    analysisPerDay: 3,
    memoryPerDay: 5,
    exportPerDay: 0,
    model: "minimax-m2.5-free",
  },
  pro: {
    characters: -1,
    chatPerDay: -1,
    analysisPerDay: -1,
    memoryPerDay: -1,
    exportPerDay: -1,
    model: "minimax-m2.5-free",
  },
  admin: {
    characters: -1,
    chatPerDay: -1,
    analysisPerDay: -1,
    memoryPerDay: -1,
    exportPerDay: -1,
    model: "minimax-m2.5-free",
  },
};

export async function getUserPlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true, isAdmin: true },
  });

  if (!user) return "free";

  // 管理员直接返回 "admin" 套餐（无限制）
  if (user.isAdmin) return "admin";

  if (user.plan === "pro" && user.planExpiresAt) {
    if (new Date() > user.planExpiresAt) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free", planExpiresAt: null },
      });
      return "free";
    }
  }

  return user.plan;
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export async function checkUsageLimit(
  userId: string,
  action: "chat" | "analysis" | "memory" | "export"
): Promise<{ allowed: boolean; remaining: number; limit: number; plan: string }> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const today = new Date().toISOString().split("T")[0];

  const limitKey = `${action}PerDay` as keyof PlanLimits;
  const limit = limits[limitKey] as number;

  if (limit === -1) {
    return { allowed: true, remaining: Infinity, limit: -1, plan };
  }

  const usage = await prisma.usageRecord.findUnique({
    where: {
      userId_type_date: { userId, type: action, date: today },
    },
  });

  const used = usage?.count || 0;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    plan,
  };
}

export async function recordUsage(
  userId: string,
  action: "chat" | "analysis" | "memory" | "export"
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  await prisma.usageRecord.upsert({
    where: {
      userId_type_date: { userId, type: action, date: today },
    },
    update: { count: { increment: 1 } },
    create: { userId, type: action, date: today, count: 1 },
  });
}

export async function checkCharacterLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  if (limits.characters === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const count = await prisma.character.count({
    where: { userId },
  });

  return {
    allowed: count < limits.characters,
    current: count,
    limit: limits.characters,
    plan,
  };
}
