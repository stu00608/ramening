import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 餐廳更新的驗證 schema
const UpdateRestaurantSchema = z.object({
  name: z.string().min(1, "店名不能為空").optional(),
  prefecture: z.string().min(1, "都道府縣不能為空").optional(),
  city: z.string().min(1, "市區町村不能為空").optional(),
  postalCode: z
    .string()
    .regex(/^\d{7}$/, "郵遞區號必須為7位數字")
    .optional(),
  address: z.string().min(1, "地址不能為空").optional(),
  googleId: z.string().optional(),
});

// GET /api/restaurants/[id] - 取得特定餐廳
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          include: {
            ramenItems: true,
            sideItems: true,
            tags: true,
            photos: true,
          },
          orderBy: {
            visitDate: "desc",
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "找不到指定的餐廳" }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("取得餐廳資料失敗:", error);
    return NextResponse.json({ error: "取得餐廳資料失敗" }, { status: 500 });
  }
}

// PUT /api/restaurants/[id] - 更新餐廳資訊
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 驗證輸入資料
    const validatedData = UpdateRestaurantSchema.parse(body);

    // 檢查餐廳是否存在
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
    });

    if (!existingRestaurant) {
      return NextResponse.json({ error: "找不到指定的餐廳" }, { status: 404 });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.errors },
        { status: 400 }
      );
    }

    console.error("更新餐廳失敗:", error);
    return NextResponse.json({ error: "更新餐廳失敗" }, { status: 500 });
  }
}

// DELETE /api/restaurants/[id] - 刪除餐廳
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 檢查餐廳是否存在
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!existingRestaurant) {
      return NextResponse.json({ error: "找不到指定的餐廳" }, { status: 404 });
    }

    // 檢查是否有關聯的評價
    if (existingRestaurant._count.reviews > 0) {
      return NextResponse.json(
        { error: "無法刪除有評價記錄的餐廳" },
        { status: 409 }
      );
    }

    await prisma.restaurant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "餐廳已成功刪除" });
  } catch (error) {
    console.error("刪除餐廳失敗:", error);
    return NextResponse.json({ error: "刪除餐廳失敗" }, { status: 500 });
  }
}
