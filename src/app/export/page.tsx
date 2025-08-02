"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Copy,
  Download,
  Instagram,
  MapPin,
  Star,
} from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  restaurantName: string;
  address: string;
  visitDate: string;
  visitTime: string;
  guestCount: number;
  reservationStatus: string;
  waitTime?: string;
  orderMethod: string;
  paymentMethods: string[];
  ramenItems: Array<{
    name: string;
    price: number;
    customization?: string;
  }>;
  sideItems: Array<{
    name: string;
    price: number;
  }>;
  tags: string[];
  textReview: string;
  rating: number;
  nearestStation?: string;
  walkingTime?: number;
}

const mockReviews: Review[] = [
  {
    id: "1",
    restaurantName: "一蘭拉麵 渋谷店",
    address: "東京都渋谷区宇田川町13-8",
    visitDate: "2024-01-15",
    visitTime: "20:30",
    guestCount: 2,
    reservationStatus: "排隊等候",
    waitTime: "30分鐘內",
    orderMethod: "食券機",
    paymentMethods: ["現金", "IC卡"],
    ramenItems: [{ name: "豚骨拉麵", price: 890, customization: "麵硬、湯濃" }],
    sideItems: [{ name: "叉燒", price: 290 }],
    tags: ["濃厚湯頭", "溏心蛋", "深夜營業"],
    textReview:
      "湯頭濃郁，麵條Q彈，整體體驗很棒！店內環境乾淨，服務態度友善，雖然需要排隊但很值得。叉燒肉質軟嫩，溏心蛋完美。",
    rating: 4.5,
    nearestStation: "渋谷駅",
    walkingTime: 5,
  },
  {
    id: "2",
    restaurantName: "麺や 七彩",
    address: "東京都台東区浅草橋5-9-2",
    visitDate: "2024-01-10",
    visitTime: "12:15",
    guestCount: 1,
    reservationStatus: "無需排隊",
    orderMethod: "注文制",
    paymentMethods: ["現金"],
    ramenItems: [{ name: "醬油拉麵", price: 780 }],
    sideItems: [{ name: "煎餃", price: 350 }],
    tags: ["清淡", "魚介拉麵", "蔥花"],
    textReview:
      "非常棒的醬油拉麵，湯頭清澈但味道豐富，魚介香味突出。煎餃也很棒，皮薄餡多。老闆很親切，是一家值得再訪的店。",
    rating: 5.0,
    nearestStation: "浅草橋駅",
    walkingTime: 3,
  },
];

export default function ExportPage() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [generatedPost, setGeneratedPost] = useState("");
  const [customTemplate, setCustomTemplate] = useState("");

  const generateInstagramPost = (review: Review) => {
    const formatReservationStatus = (status: string, waitTime?: string) => {
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
          return status;
      }
    };

    const formatPaymentMethods = (methods: string[]) => {
      return methods.join("・");
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

    const formatTime = (time: string) => {
      return time.replace(":", ":");
    };

    const generateLocationHashtags = (address: string) => {
      let locationTags = "";
      if (address.includes("東京"))
        locationTags +=
          "#東京ラーメン #東京美食 #東京拉麵 #東京旅遊 #東京自由行 ";
      if (address.includes("渋谷")) locationTags += "#渋谷ラーメン #渋谷美食 ";
      if (address.includes("新宿")) locationTags += "#新宿ラーメン #新宿美食 ";
      if (address.includes("浅草")) locationTags += "#浅草ラーメン #浅草美食 ";
      return locationTags.trim();
    };

    const post = `#${review.restaurantName}
📍${review.nearestStation}徒歩${review.walkingTime}分

拉麵🍜：${review.ramenItems.map((item) => `${item.name} ¥${item.price}`).join("、")}
${review.sideItems.length > 0 ? `配菜🍥：${review.sideItems.map((item) => `${item.name} ¥${item.price}`).join("、")}` : ""}
點餐💁：${review.orderMethod}・(${formatPaymentMethods(review.paymentMethods)})
客製🆓：${formatCustomization(review.ramenItems)}
・････━━━━━━━━━━━････・

"${review.textReview}"

・････━━━━━━━━━━━････・
🗾：${review.address}
🗓️：${formatDate(review.visitDate)} / ${formatTime(review.visitTime)}入店 / ${review.guestCount}人${formatReservationStatus(review.reservationStatus, review.waitTime)}
・････━━━━━━━━━━━････・
#在日台灣人 #ラーメン #ラーメン好き #奶辰吃拉麵 #日本拉麵 #日本美食 #日本旅遊 ${generateLocationHashtags(review.address)} #好吃`;

    return post;
  };

  const handleGeneratePost = () => {
    if (selectedReview) {
      const post = generateInstagramPost(selectedReview);
      setGeneratedPost(post);
    }
  };

  const handleCopyToClipboard = async () => {
    if (generatedPost) {
      try {
        await navigator.clipboard.writeText(generatedPost);
        alert("已複製到剪貼板！");
      } catch (err) {
        console.error("複製失敗:", err);
      }
    }
  };

  const handleDownloadText = () => {
    if (generatedPost && selectedReview) {
      const blob = new Blob([generatedPost], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `instagram_post_${selectedReview.restaurantName}_${selectedReview.visitDate}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Instagram 匯出</h1>
        <p className="text-muted-foreground">
          將您的拉麵評價轉換為 Instagram 貼文格式
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 選擇評價 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                選擇要匯出的評價
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedReview?.id || ""}
                  onValueChange={(value) => {
                    const review = mockReviews.find((r) => r.id === value);
                    setSelectedReview(review || null);
                    setGeneratedPost("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇評價..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockReviews.map((review) => (
                      <SelectItem key={review.id} value={review.id}>
                        {review.restaurantName} - {review.visitDate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedReview && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">
                      {selectedReview.restaurantName}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedReview.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedReview.visitDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(selectedReview.rating)}
                        <span className="text-sm font-medium ml-1">
                          {selectedReview.rating}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedReview.ramenItems.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item.name} ¥{item.price}
                        </Badge>
                      ))}
                      {selectedReview.sideItems.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item.name} ¥{item.price}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedReview.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {selectedReview.textReview}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleGeneratePost}
                  disabled={!selectedReview}
                  className="w-full"
                >
                  生成 Instagram 貼文
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 自訂模板（未來功能） */}
          <Card>
            <CardHeader>
              <CardTitle>自訂模板（開發中）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="您可以在此自訂 Instagram 貼文模板..."
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  className="min-h-32"
                  disabled
                />
                <Button disabled className="w-full">
                  使用自訂模板
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 預覽和匯出 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instagram 貼文預覽</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedPost ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {generatedPost}
                    </pre>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>字數統計: {generatedPost.length} 字元</p>
                    <p>建議: Instagram 貼文文字限制為 2,200 字元</p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCopyToClipboard} className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      複製文字
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadText}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下載檔案
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Instagram className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">選擇評價開始生成</p>
                  <p>選擇一個評價並點擊「生成 Instagram 貼文」</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 使用說明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用說明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div>
                  <h4 className="font-medium mb-1">📝 如何使用</h4>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>選擇要匯出的評價</li>
                    <li>點擊「生成 Instagram 貼文」</li>
                    <li>預覽生成的內容</li>
                    <li>複製文字或下載檔案</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-1">📋 模板格式</h4>
                  <p className="text-muted-foreground">
                    自動包含店名、位置、品項、價格、造訪資訊和相關標籤
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">🏷️ 標籤設定</h4>
                  <p className="text-muted-foreground">
                    根據地區自動添加相關的地點標籤
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
