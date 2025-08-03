"use client";

import { InstagramExportModal } from "@/components/instagram-export-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Edit,
  Instagram,
  MapPin,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Review {
  id: string;
  restaurantName: string;
  visitDate: string;
  visitTime?: string;
  rating: number;
  ramenItems: Array<{ name: string; price: number; customization?: string }>;
  sideItems: Array<{ name: string; price: number }>;
  tags: string[];
  address: string;
  photos: Array<{ url: string; category: string; description?: string }>;
  textReview: string;
  createdAt: string;
  guestCount?: string;
  reservationStatus?: string;
  waitTime?: string;
  orderMethod?: string;
  paymentMethods?: string[];
  nearestStation?: string;
  walkingTime?: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    restaurantName: "一蘭拉麵 渋谷店",
    visitDate: "2024-01-15",
    visitTime: "20:30",
    rating: 4.5,
    ramenItems: [{ name: "豚骨拉麵", price: 890, customization: "麵硬、湯濃" }],
    sideItems: [{ name: "溏心蛋", price: 130 }],
    tags: ["濃厚湯頭", "溏心蛋", "深夜營業"],
    address: "東京都渋谷区宇田川町13-8",
    photos: [
      { url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400", category: "拉麵", description: "豚骨拉麵" },
      { url: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400", category: "副餐", description: "溏心蛋" },
      { url: "https://images.unsplash.com/photo-1555992336-03a23c0aba43?w=400", category: "店內環境" },
    ],
    textReview:
      "湯頭濃郁，麵條Q彈，整體體驗很棒！店內環境乾淨，服務態度友善...",
    createdAt: "2024-01-15T20:30:00Z",
    guestCount: "1",
    reservationStatus: "排隊等候",
    waitTime: "30分鐘內",
    orderMethod: "食券機",
    paymentMethods: ["現金", "QR決済"],
    nearestStation: "渋谷駅",
    walkingTime: "3",
  },
  {
    id: "2",
    restaurantName: "麺や 七彩",
    visitDate: "2024-01-10",
    visitTime: "12:15",
    rating: 5.0,
    ramenItems: [{ name: "醬油拉麵", price: 800 }],
    sideItems: [{ name: "煎餃", price: 280 }],
    tags: ["清淡", "魚介拉麵", "蔥花"],
    address: "東京都台東区浅草橋5-9-2",
    photos: [
      { url: "https://images.unsplash.com/photo-1588613254457-14a5c0a26f0a?w=400", category: "拉麵", description: "醬油拉麵" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", category: "副餐", description: "煎餃" },
      { url: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=400", category: "店內環境" },
      { url: "https://images.unsplash.com/photo-1559847844-d508066760bb?w=400", category: "菜單" },
      { url: "https://images.unsplash.com/photo-1555992336-03a23c0aba43?w=400", category: "店家外觀" },
    ],
    textReview: "非常棒的醬油拉麵，湯頭清澈但味道豐富，魚介香味突出...",
    createdAt: "2024-01-10T12:15:00Z",
    guestCount: "2",
    reservationStatus: "無需排隊",
    orderMethod: "注文制",
    paymentMethods: ["現金", "信用卡"],
    nearestStation: "浅草橋駅",
    walkingTime: "2",
  },
  {
    id: "3",
    restaurantName: "らーめん 大至急",
    visitDate: "2024-01-05",
    visitTime: "19:45",
    rating: 4.0,
    ramenItems: [{ name: "味噌拉麵", price: 850 }],
    sideItems: [],
    tags: ["味噌拉麵", "粗麵", "叉燒"],
    address: "東京都新宿区歌舞伎町1-6-2",
    photos: [
      { url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400", category: "拉麵", description: "味噌拉麵" },
      { url: "https://images.unsplash.com/photo-1555992336-03a23c0aba43?w=400", category: "店內環境" },
    ],
    textReview: "味噌湯頭香濃，叉燒肉質軟嫩，性價比不錯的選擇...",
    createdAt: "2024-01-05T19:45:00Z",
    guestCount: "1",
    reservationStatus: "事前預約",
    orderMethod: "食券機",
    paymentMethods: ["現金"],
    nearestStation: "新宿駅",
    walkingTime: "5",
  },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedReviewForExport, setSelectedReviewForExport] =
    useState<Review | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const filteredAndSortedReviews = reviews
    .filter((review) => {
      if (filterBy === "all") return true;
      if (filterBy === "high-rating") return review.rating >= 4.5;
      if (filterBy === "recent") {
        const reviewDate = new Date(review.visitDate);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return reviewDate >= oneMonthAgo;
      }
      return true;
    })
    .filter(
      (review) =>
        searchTerm === "" ||
        review.restaurantName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        review.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "rating-high":
          return b.rating - a.rating;
        case "rating-low":
          return a.rating - b.rating;
        case "restaurant-name":
          return a.restaurantName.localeCompare(b.restaurantName);
        default:
          return 0;
      }
    });

  const handleDelete = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reviewToDelete) {
      setReviews(reviews.filter((review) => review.id !== reviewToDelete));
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleInstagramExport = (review: Review) => {
    setSelectedReviewForExport(review);
    setExportModalOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={`star-${rating}-${i}`}
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

  const getRamenPhoto = (review: Review) => {
    return review.photos.find(photo => photo.category === "拉麵");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">評價管理</h1>
          <Button asChild>
            <Link href="/reviews/new">建立新評價</Link>
          </Button>
        </div>
        <p className="text-muted-foreground">管理您的所有拉麵店評價記錄</p>
      </div>

      {/* 搜尋和篩選 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜尋店名、地址或標籤..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">最新評價</SelectItem>
                <SelectItem value="oldest">最舊評價</SelectItem>
                <SelectItem value="rating-high">評分高到低</SelectItem>
                <SelectItem value="rating-low">評分低到高</SelectItem>
                <SelectItem value="restaurant-name">店名 A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
                <SelectValue placeholder="篩選條件" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有評價</SelectItem>
                <SelectItem value="high-rating">高評分 (4.5+)</SelectItem>
                <SelectItem value="recent">近一個月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 統計資訊 */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">總評價數</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(reviews.map((review) => review.restaurantName)).size}
            </div>
            <p className="text-xs text-muted-foreground">造訪店舖數</p>
          </CardContent>
        </Card>
      </div>

      {/* 評價列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            評價列表 ({filteredAndSortedReviews.length} 則)
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">找不到符合條件的評價</p>
              <p className="text-muted-foreground mb-4">
                請嘗試調整搜尋條件或篩選設定
              </p>
              <Button asChild>
                <Link href="/reviews/new">建立第一則評價</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReviews.map((review) => (
              <Card
                key={review.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* 拉麵照片預覽 */}
                    {getRamenPhoto(review) && (
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={getRamenPhoto(review)!.url}
                          alt={getRamenPhoto(review)!.description || "拉麵照片"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {review.restaurantName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{review.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{review.visitDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium ml-1">
                            {review.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-1">
                        {review.ramenItems.slice(0, 2).map((item) => (
                          <Badge
                            key={`ramen-${item.name}-${item.price}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {item.name}
                          </Badge>
                        ))}
                        {review.sideItems.slice(0, 1).map((item) => (
                          <Badge
                            key={`side-${item.name}-${item.price}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {item.name}
                          </Badge>
                        ))}
                        {review.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={`tag-${tag}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.textReview}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 justify-start">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/reviews/${review.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          編輯
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInstagramExport(review)}
                        className="text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        IG匯出
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(review.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        刪除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Instagram 匯出 Modal */}
      {selectedReviewForExport && (
        <InstagramExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          review={selectedReviewForExport}
        />
      )}

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除評價</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。確定要刪除這則評價嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
