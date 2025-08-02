import { prisma } from "@/lib/prisma";
import { PhotoCategory, RamenCategory } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 拉麵品項的驗證 schema
const RamenItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "拉麵名稱不能為空"),
  price: z.number().min(0, "價格必須大於等於0"),
  category: z.nativeEnum(RamenCategory),
  customization: z.string().optional(),
});

// 副餐品項的驗證 schema
const SideItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "副餐名稱不能為空"),
  price: z.number().min(0, "價格必須大於等於0"),
});

// 照片的驗證 schema
const PhotoSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1, "檔案名稱不能為空"),
  path: z.string().min(1, "檔案路徑不能為空"),
  category: z.nativeEnum(PhotoCategory),
  size: z.number().min(1, "檔案大小必須大於0"),
});

// 評價更新的驗證 schema
const UpdateReviewSchema = z.object({
  visitDate: z.string().datetime("造訪日期格式錯誤").optional(),
  visitTime: z.string().min(1, "造訪時間不能為空").optional(),
  partySize: z
    .number()
    .min(1, "用餐人數必須至少1人")
    .max(15, "用餐人數過多")
    .optional(),
  reservationStatus: z
    .enum(["無需排隊", "排隊等候", "事前預約", "記名制"])
    .optional(),
  waitTime: z.number().min(0).optional(),
  orderMethod: z.enum(["食券機", "注文制", "其他"]).optional(),
  paymentMethods: z
    .array(z.enum(["現金", "QR決済", "交通系IC", "信用卡"]))
    .min(1, "必須選擇至少一種付款方式")
    .optional(),
  ramenItems: z
    .array(RamenItemSchema)
    .min(1, "必須至少有一個拉麵品項")
    .max(5, "拉麵品項不能超過5個")
    .optional(),
  sideItems: z.array(SideItemSchema).max(10, "副餐品項不能超過10個").optional(),
  tags: z.array(z.string()).optional(),
  textReview: z
    .string()
    .min(10, "評價內容至少需要10個字")
    .max(1000, "評價內容不能超過1000字")
    .optional(),
  photos: z.array(PhotoSchema).optional(),
});

// GET /api/reviews/[id] - 取得特定評價
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        restaurant: true,
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "找不到指定的評價" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("取得評價資料失敗:", error);
    return NextResponse.json({ error: "取得評價資料失敗" }, { status: 500 });
  }
}

// PUT /api/reviews/[id] - 更新評價
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 驗證輸入資料
    const validatedData = UpdateReviewSchema.parse(body);

    // 檢查評價是否存在
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "找不到指定的評價" }, { status: 404 });
    }

    // 驗證預約狀態和等待時間的邏輯
    const reservationStatus =
      validatedData.reservationStatus ||
      (existingReview.hasReservation ? "事前預約" : "無需排隊");
    if (
      reservationStatus === "排隊等候" &&
      !validatedData.waitTime &&
      !existingReview.waitTime
    ) {
      return NextResponse.json(
        { error: "選擇排隊等候時必須填寫等待時間" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 更新基本評價資料
      const updateData: Record<string, unknown> = {};

      if (validatedData.visitDate)
        updateData.visitDate = new Date(validatedData.visitDate);
      if (validatedData.visitTime)
        updateData.visitTime = validatedData.visitTime;
      if (validatedData.partySize)
        updateData.partySize = validatedData.partySize;
      if (validatedData.reservationStatus)
        updateData.hasReservation =
          validatedData.reservationStatus !== "無需排隊";
      if (validatedData.waitTime !== undefined)
        updateData.waitTime = validatedData.waitTime;
      if (validatedData.orderMethod)
        updateData.orderMethod = validatedData.orderMethod;
      if (validatedData.paymentMethods)
        updateData.paymentMethod = validatedData.paymentMethods.join(", ");
      if (validatedData.textReview)
        updateData.textReview = validatedData.textReview;

      const review = await tx.review.update({
        where: { id: params.id },
        data: updateData,
      });

      // 更新拉麵品項
      if (validatedData.ramenItems) {
        // 刪除現有的拉麵品項
        await tx.ramenItem.deleteMany({
          where: { reviewId: params.id },
        });

        // 建立新的拉麵品項
        if (validatedData.ramenItems.length > 0) {
          await tx.ramenItem.createMany({
            data: validatedData.ramenItems.map((item) => ({
              name: item.name,
              price: item.price,
              category: item.category,
              customization: item.customization,
              reviewId: params.id,
            })),
          });
        }
      }

      // 更新副餐品項
      if (validatedData.sideItems) {
        // 刪除現有的副餐品項
        await tx.sideItem.deleteMany({
          where: { reviewId: params.id },
        });

        // 建立新的副餐品項
        if (validatedData.sideItems.length > 0) {
          await tx.sideItem.createMany({
            data: validatedData.sideItems.map((item) => ({
              name: item.name,
              price: item.price,
              reviewId: params.id,
            })),
          });
        }
      }

      // 更新標籤
      if (validatedData.tags) {
        // 斷開現有的標籤關係
        await tx.review.update({
          where: { id: params.id },
          data: {
            tags: {
              set: [],
            },
          },
        });

        // 處理新的標籤
        if (validatedData.tags.length > 0) {
          const tagOperations = validatedData.tags.map(async (tagName) => {
            const tag = await tx.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
            return tag;
          });

          const tags = await Promise.all(tagOperations);

          // 連接新的標籤
          await tx.review.update({
            where: { id: params.id },
            data: {
              tags: {
                connect: tags.map((tag) => ({ id: tag.id })),
              },
            },
          });
        }
      }

      // 更新照片
      if (validatedData.photos) {
        // 刪除現有的照片記錄
        await tx.photo.deleteMany({
          where: { reviewId: params.id },
        });

        // 建立新的照片記錄
        if (validatedData.photos.length > 0) {
          await tx.photo.createMany({
            data: validatedData.photos.map((photo) => ({
              filename: photo.filename,
              path: photo.path,
              category: photo.category,
              size: photo.size,
              reviewId: params.id,
            })),
          });
        }
      }

      return review;
    });

    // 回傳完整的評價資料
    const completeReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        restaurant: true,
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    return NextResponse.json(completeReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.errors },
        { status: 400 }
      );
    }

    console.error("更新評價失敗:", error);
    return NextResponse.json({ error: "更新評價失敗" }, { status: 500 });
  }
}

// DELETE /api/reviews/[id] - 刪除評價
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 檢查評價是否存在
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        photos: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "找不到指定的評價" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 刪除評價會自動刪除相關的子記錄（因為設定了 onDelete: Cascade）
      await tx.review.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ message: "評價已成功刪除" });
  } catch (error) {
    console.error("刪除評價失敗:", error);
    return NextResponse.json({ error: "刪除評價失敗" }, { status: 500 });
  }
}
