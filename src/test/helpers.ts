import { NextRequest } from "next/server";

/**
 * 建立測試用的 NextRequest 物件
 * @param url 請求 URL
 * @param options 請求選項
 * @returns NextRequest 物件
 */
export function createRequest(url: string, options: RequestInit = {}) {
  // 過濾掉可能導致類型錯誤的屬性
  const { signal, ...safeOptions } = options;
  return new NextRequest(url, {
    method: "GET",
    ...safeOptions,
  });
}
