import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { formatValidationError } from "./validation";

// 錯誤類型定義
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  RATE_LIMITED = "RATE_LIMITED",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// 自定義錯誤類別
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    details?: unknown
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }
}

// 常用錯誤建構函數
export const Errors = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      ErrorType.NOT_FOUND,
      `找不到指定的${resource}${id ? ` (ID: ${id})` : ""}`,
      404
    ),

  conflict: (message: string, details?: unknown) =>
    new AppError(ErrorType.CONFLICT, message, 409, details),

  validation: (message: string, details?: unknown) =>
    new AppError(ErrorType.VALIDATION_ERROR, message, 400, details),

  unauthorized: (message = "需要身份驗證") =>
    new AppError(ErrorType.UNAUTHORIZED, message, 401),

  forbidden: (message = "沒有權限執行此操作") =>
    new AppError(ErrorType.FORBIDDEN, message, 403),

  rateLimited: (message = "請求過於頻繁，請稍後再試") =>
    new AppError(ErrorType.RATE_LIMITED, message, 429),

  externalApi: (service: string, message?: string) =>
    new AppError(
      ErrorType.EXTERNAL_API_ERROR,
      `外部服務 ${service} 錯誤${message ? `: ${message}` : ""}`,
      502
    ),

  database: (operation: string, details?: unknown) =>
    new AppError(
      ErrorType.DATABASE_ERROR,
      `資料庫${operation}失敗`,
      500,
      details
    ),

  fileUpload: (message: string, details?: unknown) =>
    new AppError(ErrorType.FILE_UPLOAD_ERROR, message, 400, details),

  internal: (message = "內部伺服器錯誤", details?: unknown) =>
    new AppError(ErrorType.INTERNAL_SERVER_ERROR, message, 500, details),
};

// 錯誤處理器函數
export function handleError(error: unknown): NextResponse {
  console.error("API 錯誤:", error);

  // AppError (自定義錯誤)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        type: error.type,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Zod 驗證錯誤
  if (error instanceof z.ZodError) {
    const formattedError = formatValidationError(error);
    return NextResponse.json(
      {
        error: formattedError.message,
        type: ErrorType.VALIDATION_ERROR,
        details: formattedError.errors,
      },
      { status: 400 }
    );
  }

  // Prisma 錯誤
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: "資料庫驗證錯誤",
        type: ErrorType.DATABASE_ERROR,
        details: error.message,
      },
      { status: 400 }
    );
  }

  // 一般 Error 物件
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        type: ErrorType.INTERNAL_SERVER_ERROR,
      },
      { status: 500 }
    );
  }

  // 未知錯誤
  return NextResponse.json(
    {
      error: "內部伺服器錯誤",
      type: ErrorType.INTERNAL_SERVER_ERROR,
    },
    { status: 500 }
  );
}

// Prisma 錯誤處理
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse {
  switch (error.code) {
    case "P2002": {
      // 唯一性約束違反
      const target = error.meta?.target as string[];
      const field = target?.[0] || "欄位";
      return NextResponse.json(
        {
          error: `${field} 已存在`,
          type: ErrorType.CONFLICT,
          details: error.meta,
        },
        { status: 409 }
      );
    }

    case "P2025":
      // 記錄不存在
      return NextResponse.json(
        {
          error: "找不到指定的記錄",
          type: ErrorType.NOT_FOUND,
          details: error.meta,
        },
        { status: 404 }
      );

    case "P2003":
      // 外鍵約束違反
      return NextResponse.json(
        {
          error: "關聯資料不存在",
          type: ErrorType.VALIDATION_ERROR,
          details: error.meta,
        },
        { status: 400 }
      );

    case "P2014":
      // 關聯記錄還有依賴
      return NextResponse.json(
        {
          error: "無法刪除：仍有關聯資料存在",
          type: ErrorType.CONFLICT,
          details: error.meta,
        },
        { status: 409 }
      );

    default:
      return NextResponse.json(
        {
          error: "資料庫操作失敗",
          type: ErrorType.DATABASE_ERROR,
          details: error.meta,
        },
        { status: 500 }
      );
  }
}

// 異步錯誤包裝器
export function asyncHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

// 日誌記錄器
export function logError(error: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    context,
  };

  console.error("錯誤記錄:", JSON.stringify(errorInfo, null, 2));
}
