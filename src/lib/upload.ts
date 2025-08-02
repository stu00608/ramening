import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// 支援的圖片格式
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 圖片上傳配置
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: SUPPORTED_IMAGE_TYPES,
  uploadDir: "./public/uploads",
  webpQuality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
};

// 確保上傳目錄存在
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_CONFIG.uploadDir);
  } catch {
    await fs.mkdir(UPLOAD_CONFIG.uploadDir, { recursive: true });
  }
}

// 驗證檔案類型
export function validateFileType(file: File): boolean {
  return UPLOAD_CONFIG.allowedTypes.includes(file.type);
}

// 驗證檔案大小
export function validateFileSize(file: File): boolean {
  return file.size <= UPLOAD_CONFIG.maxFileSize;
}

// 處理圖片上傳和轉換
export async function processImageUpload(file: File): Promise<{
  filename: string;
  path: string;
  size: number;
}> {
  // 驗證檔案
  if (!validateFileType(file)) {
    throw new Error("不支援的檔案格式。僅支援 JPEG、PNG 和 WebP 格式");
  }

  if (!validateFileSize(file)) {
    throw new Error(
      `檔案大小超過限制 (最大 ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`
    );
  }

  // 確保上傳目錄存在
  await ensureUploadDir();

  // 生成唯一檔案名稱
  const fileId = uuidv4();
  const filename = `${fileId}.webp`;
  const filePath = path.join(UPLOAD_CONFIG.uploadDir, filename);

  try {
    // 讀取檔案內容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 Sharp 處理圖片：調整大小並轉換為 WebP
    const processedBuffer = await sharp(buffer)
      .resize(UPLOAD_CONFIG.maxWidth, UPLOAD_CONFIG.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: UPLOAD_CONFIG.webpQuality })
      .toBuffer();

    // 儲存檔案
    await fs.writeFile(filePath, processedBuffer);

    return {
      filename,
      path: `/uploads/${filename}`,
      size: processedBuffer.length,
    };
  } catch (error) {
    console.error("圖片處理失敗:", error);
    throw new Error("圖片處理失敗");
  }
}

// 刪除檔案
export async function deleteUploadedFile(filename: string): Promise<void> {
  try {
    const filePath = path.join(UPLOAD_CONFIG.uploadDir, filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("刪除檔案失敗:", error);
    // 不拋出錯誤，因為檔案可能已經不存在
  }
}

// 批量刪除檔案
export async function deleteMultipleFiles(filenames: string[]): Promise<void> {
  const deletePromises = filenames.map((filename) =>
    deleteUploadedFile(filename)
  );
  await Promise.allSettled(deletePromises);
}
