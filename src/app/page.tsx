import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Instagram, Plus, Search, Star } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">歡迎使用 Ramening</h1>
        <p className="text-lg text-muted-foreground">
          您的日本拉麵評價紀錄工具，幫助您記錄和管理拉麵店造訪經驗
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-pink-600" />
              搜尋拉麵店
            </CardTitle>
            <CardDescription>
              使用 Google Places API 搜尋日本境內的拉麵店
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/search">開始搜尋</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-pink-600" />
              建立評價
            </CardTitle>
            <CardDescription>
              記錄您的拉麵店造訪體驗，包含照片和詳細評分
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/reviews/new">新增評價</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-pink-600" />
              評價管理
            </CardTitle>
            <CardDescription>
              查看、搜尋和編輯您的所有拉麵店評價記錄
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/reviews">查看評價</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              Instagram 匯出
            </CardTitle>
            <CardDescription>
              將評價轉換為 Instagram 貼文格式，分享您的體驗
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/reviews">匯出貼文</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>快速開始</CardTitle>
            <CardDescription>
              按照以下步驟開始記錄您的拉麵評價之旅
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-xs text-white">
                1
              </div>
              <div>
                <p className="font-medium">搜尋拉麵店</p>
                <p className="text-sm text-muted-foreground">
                  使用搜尋功能找到您想要評價的日本拉麵店
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-xs text-white">
                2
              </div>
              <div>
                <p className="font-medium">建立詳細評價</p>
                <p className="text-sm text-muted-foreground">
                  記錄造訪詳情、上傳照片、評分拉麵品項
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-xs text-white">
                3
              </div>
              <div>
                <p className="font-medium">管理和分享</p>
                <p className="text-sm text-muted-foreground">
                  在儀表板管理評價，或匯出為 Instagram 貼文格式
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
