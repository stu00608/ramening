import { prisma } from "@/lib/prisma";
import { PhotoCategory, RamenCategory } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 拉麵品項的驗證 schema
const RamenItemSchema = z.object({
  name: z.string().min(1, "拉麵名稱不能為空"),
  price: z.number().min(0, "價格必須大於等於0"),
  category: z.nativeEnum(RamenCategory),
  customization: z.string().optional(),
});

// 副餐品項的驗證 schema
const SideItemSchema = z.object({
  name: z.string().min(1, "副餐名稱不能為空"),
  price: z.number().min(0, "價格必須大於等於0"),
});

// 照片的驗證 schema
const PhotoSchema = z.object({
  filename: z.string().min(1, "檔案名稱不能為空"),
  path: z.string().min(1, "檔案路徑不能為空"),
  category: z.nativeEnum(PhotoCategory),
  size: z.number().min(1, "檔案大小必須大於0"),
});

// 評價建立的驗證 schema
const CreateReviewSchema = z.object({
  restaurantId: z.string().min(1, "餐廳ID不能為空"),
  visitDate: z.string().datetime("造訪日期格式錯誤"),
  visitTime: z.string().min(1, "造訪時間不能為空"),
  partySize: z.number().min(1, "用餐人數必須至少1人").max(15, "用餐人數過多"),
  reservationStatus: z.enum(["無需排隊", "排隊等候", "事前預約", "記名制"]),
  waitTime: z.number().min(0).optional(),
  orderMethod: z.enum(["食券機", "注文制", "其他"]),
  paymentMethods: z
    .array(z.enum(["現金", "QR決済", "交通系IC", "信用卡"]))
    .min(1, "必須選擇至少一種付款方式"),
  ramenItems: z
    .array(RamenItemSchema)
    .min(1, "必須至少有一個拉麵品項")
    .max(5, "拉麵品項不能超過5個"),
  sideItems: z.array(SideItemSchema).max(10, "副餐品項不能超過10個"),
  tags: z.array(z.string()).optional(),
  textReview: z
    .string()
    .min(10, "評價內容至少需要10個字")
    .max(1000, "評價內容不能超過1000字"),
  photos: z.array(PhotoSchema).optional(),
});

// 評價更新的驗證 schema
const UpdateReviewSchema = CreateReviewSchema.partial().omit({
  restaurantId: true,
});

// GET /api/reviews - 取得評價清單
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "visitDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const where: { restaurantId?: string } = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          restaurant: true,
          ramenItems: true,
          sideItems: true,
          tags: true,
          photos: true,
        },
        orderBy,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("取得評價清單失敗:", error);
    return NextResponse.json({ error: "取得評價清單失敗" }, { status: 500 });
  }
}

// POST /api/reviews - 建立新評價
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證輸入資料
    const validatedData = CreateReviewSchema.parse(body);

    // 檢查餐廳是否存在
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: validatedData.restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "找不到指定的餐廳" }, { status: 404 });
    }

    // 驗證預約狀態和等待時間的邏輯
    if (
      validatedData.reservationStatus === "排隊等候" &&
      !validatedData.waitTime
    ) {
      return NextResponse.json(
        { error: "選擇排隊等候時必須填寫等待時間" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 建立評價
      const review = await tx.review.create({
        data: {
          restaurantId: validatedData.restaurantId,
          visitDate: new Date(validatedData.visitDate),
          visitTime: validatedData.visitTime,
          partySize: validatedData.partySize,
          hasReservation: validatedData.reservationStatus !== "無需排隊",
          waitTime: validatedData.waitTime,
          orderMethod: validatedData.orderMethod,
          paymentMethod: validatedData.paymentMethods.join(", "),
          textReview: validatedData.textReview,
        },
      });

      // 建立拉麵品項
      if (validatedData.ramenItems.length > 0) {
        await tx.ramenItem.createMany({
          data: validatedData.ramenItems.map((item) => ({
            ...item,
            reviewId: review.id,
          })),
        });
      }

      // 建立副餐品項
      if (validatedData.sideItems.length > 0) {
        await tx.sideItem.createMany({
          data: validatedData.sideItems.map((item) => ({
            ...item,
            reviewId: review.id,
          })),
        });
      }

      // 處理標籤
      if (validatedData.tags && validatedData.tags.length > 0) {
        const tagOperations = validatedData.tags.map(async (tagName) => {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          return tag;
        });

        const tags = await Promise.all(tagOperations);

        // 連接評價和標籤的多對多關係
        await tx.review.update({
          where: { id: review.id },
          data: {
            tags: {
              connect: tags.map((tag) => ({ id: tag.id })),
            },
          },
        });
      }

      // 建立照片記錄
      if (validatedData.photos && validatedData.photos.length > 0) {
        await tx.photo.createMany({
          data: validatedData.photos.map((photo) => ({
            ...photo,
            reviewId: review.id,
          })),
        });
      }

      return review;
    });

    // 回傳完整的評價資料
    const completeReview = await prisma.review.findUnique({
      where: { id: result.id },
      include: {
        restaurant: true,
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    return NextResponse.json(completeReview, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.errors },
        { status: 400 }
      );
    }

    console.error("建立評價失敗:", error);
    return NextResponse.json({ error: "建立評價失敗" }, { status: 500 });
  }
}
