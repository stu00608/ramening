import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/restaurants/[id]/tags - 取得餐廳的推薦標籤
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 檢查餐廳是否存在
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "餐廳不存在" },
        { status: 404 }
      );
    }

    // 獲取該餐廳所有評價中使用過的標籤
    const reviews = await prisma.review.findMany({
      where: { restaurantId: id },
      include: {
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    // 統計標籤使用頻率
    const tagCounts = new Map<string, number>();
    for (const review of reviews) {
      for (const tag of review.tags) {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
      }
    }

    // 按使用頻率排序並返回前10個標籤
    const sortedTags = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name]) => name);

    return NextResponse.json({
      success: true,
      tags: sortedTags,
    });
  } catch (error) {
    console.error("取得推薦標籤失敗:", error);
    return NextResponse.json(
      { success: false, error: "取得推薦標籤失敗" },
      { status: 500 }
    );
  }
}
