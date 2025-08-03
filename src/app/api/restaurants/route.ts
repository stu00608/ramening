import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 餐廳建立的驗證 schema
const CreateRestaurantSchema = z.object({
  name: z.string().min(1, "店名不能為空"),
  prefecture: z.string().min(1, "都道府縣不能為空"),
  city: z.string().min(1, "市區町村不能為空"),
  postalCode: z.string().regex(/^\d{7}$/, "郵遞區號必須為7位數字"),
  address: z.string().min(1, "地址不能為空"),
  googleId: z.string().optional(),
});

// GET /api/restaurants - 取得所有餐廳或搜尋餐廳
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const prefecture = searchParams.get("prefecture");
    const city = searchParams.get("city");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (prefecture) {
      where.prefecture = prefecture;
    }

    if (city) {
      where.city = city;
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    return NextResponse.json({
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("取得餐廳清單失敗:", error);
    return NextResponse.json({ error: "取得餐廳清單失敗" }, { status: 500 });
  }
}

// POST /api/restaurants - 建立新餐廳
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證輸入資料
    const validatedData = CreateRestaurantSchema.parse(body);

    // 檢查是否已存在相同的餐廳 (透過 googleId 或地址)
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          validatedData.googleId ? { googleId: validatedData.googleId } : {},
          {
            AND: [
              { name: validatedData.name },
              { address: validatedData.address },
            ],
          },
        ],
      },
    });

    if (existingRestaurant) {
      return NextResponse.json({ error: "此餐廳已存在" }, { status: 409 });
    }

    const restaurant = await prisma.restaurant.create({
      data: validatedData,
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    console.error("建立餐廳失敗:", error);
    return NextResponse.json({ error: "建立餐廳失敗" }, { status: 500 });
  }
}
