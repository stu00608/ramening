import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ramening - 日本拉麵評價紀錄工具",
  description: "記錄和管理日本拉麵店造訪經驗的本地端工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
