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
import type { Review } from "@/types/review";
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// 用於轉換資料庫資料的介面
interface DatabaseReview {
  id: string;
  visitDate: string;
  visitTime: string;
  partySize: number;
  reservationStatus: string;
  waitTime?: number;
  orderMethod: string;
  paymentMethod: string;
  textReview: string;
  nearestStation?: string;
  walkingTime?: number;
  stationPlaceId?: string;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    prefecture: string;
    city: string;
    postalCode: string;
    address: string;
    googleId?: string;
  };
  ramenItems: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    customization?: string;
  }>;
  sideItems: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
  }>;
  photos: Array<{
    id: string;
    filename: string;
    path: string;
    category: string;
    size: number;
  }>;
}

// 轉換資料庫資料為前端 Review 格式
const convertDatabaseReview = (dbReview: DatabaseReview): Review => {
  return {
    id: dbReview.id,
    restaurantName: dbReview.restaurant.name,
    visitDate: new Date(dbReview.visitDate).toISOString().split("T")[0],
    visitTime: dbReview.visitTime,
    rating: 4.5, // 暫時固定值，因為資料庫中還沒有評分欄位
    ramenItems: dbReview.ramenItems.map((item) => ({
      name: item.name,
      price: item.price,
      customization: item.customization || "",
    })),
    sideItems: dbReview.sideItems.map((item) => ({
      name: item.name,
      price: item.price,
    })),
    tags: dbReview.tags.map((tag) => tag.name),
    address: dbReview.restaurant.address.startsWith(
      dbReview.restaurant.prefecture
    )
      ? dbReview.restaurant.address
      : `${dbReview.restaurant.prefecture}${dbReview.restaurant.city}${dbReview.restaurant.address}`,
    photos: dbReview.photos.map((photo) => ({
      url: `/uploads/${photo.filename}`, // 假設照片存放在 uploads 目錄
      category: photo.category,
      description: photo.filename,
    })),
    textReview: dbReview.textReview,
    createdAt: dbReview.createdAt,
    guestCount: dbReview.partySize.toString(),
    reservationStatus: dbReview.reservationStatus,
    waitTime: dbReview.waitTime ? `${dbReview.waitTime}分鐘` : undefined,
    orderMethod: dbReview.orderMethod,
    paymentMethods: dbReview.paymentMethod.split(", "),
    nearestStation: dbReview.nearestStation,
    walkingTime: dbReview.walkingTime?.toString(),
  };
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedReviewForExport, setSelectedReviewForExport] =
    useState<Review | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // 載入評價資料
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) {
        throw new Error("載入評價失敗");
      }
      const data = await response.json();

      if (data.reviews && Array.isArray(data.reviews)) {
        const convertedReviews = data.reviews.map((dbReview: DatabaseReview) =>
          convertDatabaseReview(dbReview)
        );
        setReviews(convertedReviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("載入評價錯誤:", error);
      toast.error("載入評價失敗: 無法載入評價資料，請重試");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 組件載入時執行
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await fetch(`/api/reviews/${reviewToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("刪除評價失敗");
      }

      // 成功刪除後從列表中移除
      setReviews(reviews.filter((review) => review.id !== reviewToDelete));
      toast.success("刪除成功: 評價已成功刪除");
    } catch (error) {
      console.error("刪除評價錯誤:", error);
      toast.error("刪除失敗: 無法刪除評價，請重試");
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleInstagramExport = (review: Review) => {
    setSelectedReviewForExport(review);
    setExportModalOpen(true);
  };

  const renderStars = (rating: number) => {
    const stars = ["first", "second", "third", "fourth", "fifth"];
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={`star-${stars[i]}`}
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
    return review.photos.find((photo) => photo.category === "拉麵");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">評價管理</h1>
          <Button asChild>
            <Link href="/search">建立新評價</Link>
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
                <Link href="/search">建立第一則評價</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReviews.map((review) => (
              <Card
                key={review.id}
                className="hover:shadow-lg transition-shadow"
                data-testid="review-card"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* 拉麵照片預覽 */}
                    {getRamenPhoto(review) && (
                      <div className="flex-shrink-0 w-32 h-32">
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
