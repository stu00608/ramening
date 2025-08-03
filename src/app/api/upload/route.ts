import { processImageUpload } from "@/lib/upload";
import { PhotoCategory } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 照片上傳驗證 schema
const UploadSchema = z.object({
  category: z.nativeEnum(PhotoCategory).optional(),
  description: z.string().max(200, "照片說明不能超過200字").optional(),
});

// POST /api/upload - 上傳照片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "請選擇要上傳的檔案" },
        { status: 400 }
      );
    }

    // 驗證其他參數
    const validationData: { category?: string; description?: string } = {};
    if (category) validationData.category = category;
    if (description) validationData.description = description;

    const validatedData = UploadSchema.parse(validationData);

    // 處理圖片上傳
    const uploadResult = await processImageUpload(file);

    const result = {
      filename: uploadResult.filename,
      path: uploadResult.path,
      size: uploadResult.size,
      category: validatedData.category || PhotoCategory.OTHER,
      description: validatedData.description,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("檔案上傳失敗:", error);
    return NextResponse.json({ error: "檔案上傳失敗" }, { status: 500 });
  }
}

// GET /api/upload - 取得上傳配置資訊
export async function GET() {
  try {
    const config = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      supportedCategories: Object.values(PhotoCategory),
      maxDescriptionLength: 200,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("取得上傳配置失敗:", error);
    return NextResponse.json({ error: "取得上傳配置失敗" }, { status: 500 });
  }
}
