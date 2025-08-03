import { Errors, handleError } from "@/lib/error-handler";
import {
  type InstagramReviewData,
  generateExportStats,
  generateInstagramPost,
  validateReviewForExport,
} from "@/lib/instagram-export";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/reviews/[id]/instagram - 生成 Instagram 匯出內容
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 取得完整的評價資料
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        restaurant: true,
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    if (!review) {
      throw Errors.notFound("評價", id);
    }

    // 驗證評價資料完整性
    const validationErrors = validateReviewForExport(review);
    if (validationErrors.length > 0) {
      throw Errors.validation("評價資料不完整，無法匯出", {
        missingFields: validationErrors,
      });
    }

    try {
      // 生成 Instagram 貼文內容
      const instagramContent = generateInstagramPost(
        review as InstagramReviewData
      );

      // 生成統計資訊
      const stats = generateExportStats(review as InstagramReviewData);

      // 檢查內容長度（Instagram 限制）
      const warnings: string[] = [];
      if (stats.characterCount > 2200) {
        warnings.push("內容可能過長，Instagram 貼文建議在2200字以內");
      }

      if (stats.hashtagCount > 30) {
        warnings.push("標籤數量過多，Instagram 建議不超過30個標籤");
      }

      return NextResponse.json({
        content: instagramContent,
        stats,
        warnings,
        reviewInfo: {
          id: review.id,
          restaurantName: review.restaurant.name,
          visitDate: review.visitDate,
          createdAt: review.createdAt,
        },
      });
    } catch (exportError) {
      console.error("Instagram 內容生成失敗:", exportError);
      throw Errors.internal("Instagram 內容生成失敗");
    }
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/reviews/[id]/instagram - 自訂 Instagram 匯出設定
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      includeHashtags = true,
      includeEmojis = true,
      customTemplate,
    } = body;

    // 取得完整的評價資料
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        restaurant: true,
        ramenItems: true,
        sideItems: true,
        tags: true,
        photos: true,
      },
    });

    if (!review) {
      throw Errors.notFound("評價", id);
    }

    // 驗證評價資料完整性
    const validationErrors = validateReviewForExport(review);
    if (validationErrors.length > 0) {
      throw Errors.validation("評價資料不完整，無法匯出", {
        missingFields: validationErrors,
      });
    }

    try {
      // 生成基礎 Instagram 內容
      let instagramContent = generateInstagramPost(
        review as InstagramReviewData
      );

      // 根據設定調整內容
      if (!includeEmojis) {
        // 移除表情符號（保留重要的分隔符號）
        instagramContent = instagramContent
          .replace(/🍜|🍥|💁|🆓|🗾|🗓️/g, "")
          .replace(/📍/g, "");
      }

      if (!includeHashtags) {
        // 移除標籤
        const lines = instagramContent.split("\n");
        const contentLines = lines.filter(
          (line) => !line.includes("#在日台灣人")
        );
        instagramContent = contentLines.join("\n");
      }

      // 如果提供自訂模板，使用模板生成內容
      if (customTemplate) {
        // 這裡可以實作自訂模板的解析和替換邏輯
        // 暫時保持原有邏輯
      }

      // 生成統計資訊
      const stats = generateExportStats(review as InstagramReviewData);

      return NextResponse.json({
        content: instagramContent,
        stats,
        settings: {
          includeHashtags,
          includeEmojis,
          customTemplate: !!customTemplate,
        },
        reviewInfo: {
          id: review.id,
          restaurantName: review.restaurant.name,
          visitDate: review.visitDate,
        },
      });
    } catch (exportError) {
      console.error("自訂 Instagram 內容生成失敗:", exportError);
      throw Errors.internal("自訂 Instagram 內容生成失敗");
    }
  } catch (error) {
    return handleError(error);
  }
}
