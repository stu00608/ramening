"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { Review } from "@/types/review";

interface InstagramExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review;
}

export function InstagramExportModal({
  open,
  onOpenChange,
  review,
}: InstagramExportModalProps) {
  const [generatedPost, setGeneratedPost] = useState("");

  const generateInstagramPost = useCallback((reviewData: Review) => {
    const formatReservationStatus = (status?: string, waitTime?: string) => {
      switch (status) {
        case "無需排隊":
          return "無需排隊";
        case "排隊等候":
          return waitTime ? `排隊${waitTime}` : "排隊等候";
        case "事前預約":
          return "事前預約";
        case "記名制":
          return "記名制";
        default:
          return "";
      }
    };

    const formatPaymentMethods = (methods?: string[]) => {
      return methods?.join("・") || "現金";
    };

    const formatCustomization = (items: Review["ramenItems"]) => {
      const customizations = items
        .filter((item) => item.customization)
        .map((item) => item.customization)
        .join("、");
      return customizations || "無";
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    };

    const formatTime = (time?: string) => {
      return time ? time.replace(":", ":") : "18:00";
    };

    const generateLocationHashtags = (address: string) => {
      let locationTags = "";
      if (address.includes("東京"))
        locationTags +=
          "#東京ラーメン #東京美食 #東京拉麵 #東京旅遊 #東京自由行 ";
      if (address.includes("渋谷")) locationTags += "#渋谷ラーメン #渋谷美食 ";
      if (address.includes("新宿")) locationTags += "#新宿ラーメン #新宿美食 ";
      if (address.includes("浅草")) locationTags += "#浅草ラーメン #浅草美食 ";
      if (address.includes("池袋")) locationTags += "#池袋ラーメン #池袋美食 ";
      return locationTags.trim();
    };

    const post = `#${reviewData.restaurantName}
📍${reviewData.nearestStation || "最寄り駅"}徒歩${reviewData.walkingTime || "5"}分

拉麵🍜：${reviewData.ramenItems.map((item) => `${item.name} ¥${item.price}`).join("、")}
${reviewData.sideItems.length > 0 ? `配菜🍥：${reviewData.sideItems.map((item) => `${item.name} ¥${item.price}`).join("、")}` : ""}
點餐💁：${reviewData.orderMethod || "食券機"}・(${formatPaymentMethods(reviewData.paymentMethods)})
客製🆓：${formatCustomization(reviewData.ramenItems)}
・････━━━━━━━━━━━････・

"${reviewData.textReview}"

・････━━━━━━━━━━━････・
🗾：${reviewData.address}
🗓️：${formatDate(reviewData.visitDate)} / ${formatTime(reviewData.visitTime)}入店 / ${reviewData.guestCount || "1"}人${formatReservationStatus(reviewData.reservationStatus, reviewData.waitTime)}
・････━━━━━━━━━━━････・
#在日台灣人 #ラーメン #ラーメン好き #奶辰吃拉麵 #日本拉麵 #日本美食 #日本旅遊 ${generateLocationHashtags(reviewData.address)} #好吃`;

    return post;
  }, []);

  const handleCopyToClipboard = async () => {
    if (generatedPost) {
      try {
        await navigator.clipboard.writeText(generatedPost);
        toast.success("已複製到剪貼板！: Instagram 貼文內容已複製到剪貼板");
      } catch (err) {
        console.error("複製失敗:", err);
        toast.error("複製失敗: 無法複製到剪貼板，請手動複製文字");
      }
    }
  };

  const handleDownload = () => {
    if (generatedPost) {
      const blob = new Blob([generatedPost], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-post-${review.restaurantName}-${review.visitDate}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 在 modal 打開時自動生成貼文
  useEffect(() => {
    if (open && review) {
      const post = generateInstagramPost(review);
      setGeneratedPost(post);
    }
  }, [open, review, generateInstagramPost]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Instagram 貼文匯出</DialogTitle>
          <DialogDescription>
            為 {review.restaurantName} 的評價生成 Instagram 貼文格式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 評價資訊預覽 */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <h3 className="font-semibold">{review.restaurantName}</h3>
            <div className="flex flex-wrap gap-2">
              {review.ramenItems.map((item) => (
                <Badge
                  key={`ramen-${item.name}-${item.price}`}
                  variant="secondary"
                >
                  {item.name} ¥{item.price}
                </Badge>
              ))}
              {review.sideItems.map((item) => (
                <Badge
                  key={`side-${item.name}-${item.price}`}
                  variant="outline"
                >
                  {item.name} ¥{item.price}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag) => (
                <Badge key={`tag-${tag}`} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 生成的貼文預覽 */}
          <div className="space-y-2">
            <label htmlFor="generated-post" className="text-sm font-medium">
              生成的 Instagram 貼文
            </label>
            <Textarea
              id="generated-post"
              value={generatedPost}
              onChange={(e) => setGeneratedPost(e.target.value)}
              className="min-h-64 font-mono text-sm"
              placeholder="貼文內容將在此顯示..."
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopyToClipboard}
              disabled={!generatedPost}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              複製文字
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!generatedPost}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              下載檔案
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
