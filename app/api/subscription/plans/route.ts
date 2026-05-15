import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    if (plans.length === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: "free",
            displayName: "免费版",
            price: 0,
            yearlyPrice: 0,
            features: JSON.stringify({
              characters: 3,
              chatPerDay: 20,
              analysisPerDay: 3,
              memoryPerDay: 5,
              exportPerDay: 0,
              model: "基础模型",
            }),
          },
          {
            name: "pro",
            displayName: "专业版",
            price: 29,
            yearlyPrice: 268,
            features: JSON.stringify({
              characters: -1,
              chatPerDay: -1,
              analysisPerDay: -1,
              memoryPerDay: -1,
              exportPerDay: -1,
              model: "高级模型",
            }),
          },
        ],
      });

      const allPlans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      });
      return NextResponse.json(allPlans);
    }

    return NextResponse.json(plans);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取套餐失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
