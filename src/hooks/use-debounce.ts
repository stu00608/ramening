import { useEffect, useState } from "react";

/**
 * 防抖 Hook - 用於延遲執行快速變化的值
 * @param value 需要防抖的值
 * @param delay 延遲時間（毫秒）
 * @returns 返回經過指定延遲後更新的值，僅在輸入值在延遲時間內未變化時才會更新
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
