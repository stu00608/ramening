"use client";

import { PhotoCropModal } from "@/components/photo-crop-modal";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector, { type Option } from "@/components/ui/multi-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  CalendarIcon,
  Camera,
  Clock,
  CreditCard,
  MapPin,
  Plus,
  Train,
  Trash2,
  Upload,
  User,
  Utensils,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// 拉麵分類選項
const ramenCategories = [
  { label: "醬油拉麵", value: "SHOYU" },
  { label: "鹽味拉麵", value: "SHIO" },
  { label: "味噌拉麵", value: "MISO" },
  { label: "豚骨拉麵", value: "TONKOTSU" },
  { label: "雞白湯拉麵", value: "CHICKEN" },
  { label: "煮干拉麵", value: "NIBOSHI" },
  { label: "魚介拉麵", value: "GYOKAI" },
  { label: "家系拉麵", value: "IEKEI" },
  { label: "二郎系拉麵", value: "JIRO" },
  { label: "沾麵", value: "TSUKEMEN" },
  { label: "擔擔麵", value: "TANTANMEN" },
  { label: "油拌麵", value: "MAZESOBA" },
  { label: "冷麵", value: "HIYASHI" },
  { label: "其他", value: "OTHER" },
];

// 付款方式選項
const paymentMethods: Option[] = [
  { value: "現金", label: "現金" },
  { value: "QR決済", label: "QR決済" },
  { value: "交通系IC", label: "交通系IC" },
  { value: "信用卡", label: "信用卡" },
];

// 照片分類選項
const photoCategories = [
  "拉麵",
  "副餐",
  "店內環境",
  "店家外觀",
  "菜單",
  "其他",
];

// 照片分類中文到英文的映射
const photoCategoryMapping: Record<string, string> = {
  拉麵: "RAMEN",
  副餐: "SIDE",
  店內環境: "INTERIOR",
  店家外觀: "EXTERIOR",
  菜單: "MENU",
  其他: "OTHER",
};

// 英文到中文的映射（用於顯示現有照片）
const photoCategoryReverseMapping: Record<string, string> = {
  RAMEN: "拉麵",
  SIDE: "副餐",
  INTERIOR: "店內環境",
  EXTERIOR: "店家外觀",
  MENU: "菜單",
  OTHER: "其他",
};

interface RamenItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  customization?: string;
}

interface SideItem {
  id?: string;
  name: string;
  price: number;
}

interface PhotoUpload {
  file: File;
  category: string;
  description?: string;
}

interface ExistingPhoto {
  id: string;
  filename: string;
  path: string;
  category: string;
  size: number;
}

interface Restaurant {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  postalCode: string;
  address: string;
  googleId?: string;
}

interface Station {
  placeId: string;
  name: string;
  walkingTime?: number;
}

interface Review {
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
  restaurant: Restaurant;
  ramenItems: RamenItem[];
  sideItems: SideItem[];
  tags: Array<{ id: string; name: string }>;
  photos: ExistingPhoto[];
}

function EditReviewPageContent({ reviewId }: { reviewId: string }) {
  const router = useRouter();

  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 評價資料
  const [review, setReview] = useState<Review | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  // 表單資料
  const [visitDate, setVisitDate] = useState<Date>();
  const [visitTime, setVisitTime] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [reservationStatus, setReservationStatus] = useState("無需排隊");
  const [waitTime, setWaitTime] = useState("");
  const [orderMethod, setOrderMethod] = useState("食券機");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    Option[]
  >([]);
  const [ramenItems, setRamenItems] = useState<RamenItem[]>([]);
  const [sideItems, setSideItems] = useState<SideItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [textReview, setTextReview] = useState("");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // 照片相關
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(
    null
  );

  // 推薦標籤
  const [recommendedTags, setRecommendedTags] = useState<Option[]>([]);

  // 載入評價資料
  useEffect(() => {
    const loadReview = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reviews/${reviewId}`);

        if (!response.ok) {
          throw new Error("載入評價失敗");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "載入評價失敗");
        }

        const reviewData: Review = data.review;
        setReview(reviewData);
        setRestaurant(reviewData.restaurant);

        // 預填表單資料
        setVisitDate(new Date(reviewData.visitDate));
        setVisitTime(reviewData.visitTime);
        setGuestCount(reviewData.partySize.toString());
        setReservationStatus(reviewData.reservationStatus);
        setWaitTime(reviewData.waitTime?.toString() || "");
        setOrderMethod(reviewData.orderMethod);

        // 處理付款方式
        const paymentMethodsArray = reviewData.paymentMethod.split(", ");
        const selectedPayments = paymentMethodsArray.map((method) => ({
          value: method,
          label: method,
        }));
        setSelectedPaymentMethods(selectedPayments);

        // 設定拉麵品項
        setRamenItems(
          reviewData.ramenItems.map((item) => ({
            ...item,
            customization: item.customization || "",
          }))
        );

        // 設定副餐品項
        setSideItems(reviewData.sideItems);

        // 設定標籤
        const tagOptions = reviewData.tags.map((tag) => ({
          value: tag.name,
          label: tag.name,
        }));
        setSelectedTags(tagOptions);

        // 設定文字評價
        setTextReview(reviewData.textReview);

        // 設定現有照片
        setExistingPhotos(reviewData.photos);

        // 載入附近車站（包含當前選擇的車站）
        if (reviewData.restaurant.googleId) {
          const currentStation =
            reviewData.nearestStation && reviewData.stationPlaceId
              ? {
                  placeId: reviewData.stationPlaceId,
                  name: reviewData.nearestStation,
                  walkingTime: reviewData.walkingTime,
                }
              : null;

          await loadNearbyStations(
            reviewData.restaurant.googleId,
            currentStation
          );
        }

        // 設定車站資訊
        if (reviewData.nearestStation && reviewData.stationPlaceId) {
          setSelectedStation({
            placeId: reviewData.stationPlaceId,
            name: reviewData.nearestStation,
            walkingTime: reviewData.walkingTime,
          });
        }

        // 載入推薦標籤
        await loadRecommendedTags(reviewData.restaurant.id);
      } catch (error) {
        console.error("載入評價錯誤:", error);
        toast.error("載入失敗: 無法載入評價資料，請重試");
        router.push("/reviews");
      } finally {
        setIsLoading(false);
      }
    };

    loadReview();
  }, [reviewId, router]);

  // 載入附近車站
  const loadNearbyStations = async (
    googlePlaceId: string,
    currentStation?: Station | null
  ) => {
    try {
      setIsLoadingStations(true);

      // 獲取餐廳詳細資料
      const detailsResponse = await fetch(
        `/api/places/details?placeId=${googlePlaceId}`
      );
      const detailsData = await detailsResponse.json();

      if (!detailsData.location) {
        return;
      }

      const location = detailsData.location;

      // 搜尋附近的車站
      const stationsResponse = await fetch(
        `/api/stations/search?lat=${location.lat}&lng=${location.lng}&radius=1500`
      );
      const stationsData = await stationsResponse.json();

      if (stationsData.stations && stationsData.stations.length > 0) {
        // 計算步行時間
        const stationsWithTime = await Promise.all(
          stationsData.stations.slice(0, 4).map(async (station: Station) => {
            try {
              const directionsResponse = await fetch(
                `/api/directions/walking?originPlaceId=${googlePlaceId}&destinationPlaceId=${station.placeId}`
              );
              const directionsData = await directionsResponse.json();

              return {
                placeId: station.placeId,
                name: station.name,
                walkingTime: directionsData.walkingTime || 999,
              };
            } catch (error) {
              return {
                placeId: station.placeId,
                name: station.name,
                walkingTime: 999,
              };
            }
          })
        );

        // 按步行時間排序
        let sortedStations = stationsWithTime
          .filter((station) => station.walkingTime <= 20)
          .sort((a, b) => a.walkingTime - b.walkingTime);

        // 如果有當前選擇的車站，確保它在列表中
        if (
          currentStation &&
          !sortedStations.find((s) => s.placeId === currentStation.placeId)
        ) {
          sortedStations = [currentStation, ...sortedStations];
        }

        setStations(sortedStations);
      }
    } catch (error) {
      console.error("載入車站錯誤:", error);
    } finally {
      setIsLoadingStations(false);
    }
  };

  // 載入推薦標籤
  const loadRecommendedTags = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tags`);
      const data = await response.json();
      if (data.tags) {
        const tagOptions = data.tags.map((tag: string) => ({
          value: tag,
          label: tag,
        }));
        setRecommendedTags(tagOptions);
      }
    } catch (error) {
      console.error("載入推薦標籤錯誤:", error);
    }
  };

  // 新增拉麵品項
  const addRamenItem = () => {
    if (ramenItems.length < 5) {
      setRamenItems([
        ...ramenItems,
        { name: "", price: 0, category: "SHOYU", customization: "" },
      ]);
    }
  };

  // 移除拉麵品項
  const removeRamenItem = (index: number) => {
    setRamenItems(ramenItems.filter((_, i) => i !== index));
  };

  // 新增副餐品項
  const addSideItem = () => {
    if (sideItems.length < 10) {
      setSideItems([...sideItems, { name: "", price: 0 }]);
    }
  };

  // 移除副餐品項
  const removeSideItem = (index: number) => {
    setSideItems(sideItems.filter((_, i) => i !== index));
  };

  // 處理照片上傳
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        if (
          file.size <= 5 * 1024 * 1024 &&
          photos.length + existingPhotos.length < 10
        ) {
          setPhotos((prev) => [
            ...prev,
            {
              file,
              category: "拉麵",
              description: "",
            },
          ]);
        } else {
          toast.error("上傳失敗: 檔案大小不能超過5MB，且總照片數不能超過10張");
        }
      }
    }
  };

  // 移除新照片
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // 移除現有照片
  const removeExistingPhoto = (photoId: string) => {
    setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    setRemovedPhotoIds((prev) => [...prev, photoId]);
  };

  // 更新照片分類
  const updatePhotoCategory = (index: number, category: string) => {
    const updated = [...photos];
    updated[index].category = category;
    setPhotos(updated);
  };

  // 更新照片描述
  const updatePhotoDescription = (index: number, description: string) => {
    const updated = [...photos];
    updated[index].description = description;
    setPhotos(updated);
  };

  // 提交表單
  const handleSubmit = async (isDraft = false) => {
    if (!restaurant) {
      toast.error("提交失敗: 餐廳資料載入中，請稍候");
      return;
    }

    // 基本驗證
    if (!visitDate || !visitTime || !textReview.trim()) {
      toast.error("提交失敗: 請填寫所有必填欄位");
      return;
    }

    if (ramenItems.filter((item) => item.name.trim()).length === 0) {
      toast.error("提交失敗: 至少需要一個拉麵品項");
      return;
    }

    if (selectedPaymentMethods.length === 0) {
      toast.error("提交失敗: 請選擇至少一種付款方式");
      return;
    }

    if (reservationStatus === "排隊等候" && !waitTime) {
      toast.error("提交失敗: 選擇排隊等候時必須填寫等待時間");
      return;
    }

    const reviewData = {
      visitDate: visitDate.toISOString(),
      visitTime,
      partySize: Number.parseInt(guestCount) || 1,
      reservationStatus,
      waitTime: waitTime ? Number.parseInt(waitTime) : null,
      orderMethod,
      paymentMethods: selectedPaymentMethods.map((m) => m.label),
      ramenItems: ramenItems.filter((item) => item.name.trim()),
      sideItems: sideItems.filter((item) => item.name.trim()),
      tags: selectedTags.map((tag) => tag.label),
      textReview: textReview.trim(),
      // 車站資訊
      nearestStation: selectedStation?.name || null,
      walkingTime: selectedStation?.walkingTime || null,
      stationPlaceId: selectedStation?.placeId || null,
      // 照片處理
      photos: photos.map((photo) => ({
        filename: photo.file.name,
        path: `/uploads/${photo.file.name}`,
        category: photoCategoryMapping[photo.category] || "OTHER",
        size: photo.file.size,
      })),
      // 移除的照片ID
      removedPhotoIds,
      isDraft,
    };

    try {
      setIsSaving(true);
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        toast.success(
          isDraft ? "更新成功: 評價草稿已儲存" : "更新成功: 評價已成功更新"
        );
        router.push("/reviews");
      } else {
        throw new Error(result.error || "更新失敗");
      }
    } catch (error: unknown) {
      console.error("更新評價錯誤:", error);
      toast.error(
        `更新失敗: ${error instanceof Error ? error.message : "請檢查網路連線並重試"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!review || !restaurant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium mb-2">找不到評價資料</p>
            <p className="text-muted-foreground mb-4">
              評價可能已被刪除或不存在
            </p>
            <Button onClick={() => router.push("/reviews")}>
              返回評價管理
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">編輯評價</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 主要表單區域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 造訪詳細資料 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                造訪詳細資料
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visit-date">造訪日期 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !visitDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {visitDate ? (
                          format(visitDate, "PPP", { locale: zhTW })
                        ) : (
                          <span>選擇日期</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={visitDate}
                        onSelect={setVisitDate}
                        initialFocus
                        locale={zhTW}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visit-time">造訪時間 *</Label>
                  <TimePicker
                    value={visitTime}
                    onChange={setVisitTime}
                    placeholder="選擇時間"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guest-count">用餐人數 *</Label>
                  <Select value={guestCount} onValueChange={setGuestCount}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇人數" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}人
                        </SelectItem>
                      ))}
                      <SelectItem value="10">10人以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservation-status">預約狀態 *</Label>
                  <Select
                    value={reservationStatus}
                    onValueChange={setReservationStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇預約狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="無需排隊">無需排隊</SelectItem>
                      <SelectItem value="排隊等候">排隊等候</SelectItem>
                      <SelectItem value="事前預約">事前預約</SelectItem>
                      <SelectItem value="記名制">記名制</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {reservationStatus === "排隊等候" && (
                <div className="space-y-2">
                  <Label htmlFor="wait-time">等待時間 *</Label>
                  <Select value={waitTime} onValueChange={setWaitTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇等待時間" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10分鐘內</SelectItem>
                      <SelectItem value="30">30分鐘內</SelectItem>
                      <SelectItem value="60">1小時內</SelectItem>
                      <SelectItem value="120">2小時內</SelectItem>
                      <SelectItem value="120+">2小時以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 點餐細節 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                點餐細節
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order-method">點餐方式 *</Label>
                  <Select value={orderMethod} onValueChange={setOrderMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇點餐方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="食券機">食券機</SelectItem>
                      <SelectItem value="注文制">注文制</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>付款方式 *</Label>
                  <MultipleSelector
                    value={selectedPaymentMethods}
                    onChange={setSelectedPaymentMethods}
                    defaultOptions={paymentMethods}
                    placeholder="選擇付款方式..."
                    emptyIndicator={
                      <p className="text-center text-sm leading-10 text-gray-600 dark:text-gray-400">
                        沒有找到相關選項
                      </p>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 拉麵品項 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                拉麵品項 (1-5個)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ramenItems.map((item, index) => (
                <div
                  key={`ramen-${item.name || "unnamed"}-${index}`}
                  className="space-y-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">拉麵 #{index + 1}</h4>
                    {ramenItems.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRamenItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>品項名稱 *</Label>
                      <Input
                        placeholder="例：醬油拉麵"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...ramenItems];
                          updated[index].name = e.target.value;
                          setRamenItems(updated);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>價格 *</Label>
                      <Input
                        type="number"
                        placeholder="800"
                        value={item.price || ""}
                        onChange={(e) => {
                          const updated = [...ramenItems];
                          updated[index].price =
                            Number.parseInt(e.target.value) || 0;
                          setRamenItems(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>拉麵分類 *</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => {
                          const updated = [...ramenItems];
                          updated[index].category = value;
                          setRamenItems(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇分類" />
                        </SelectTrigger>
                        <SelectContent>
                          {ramenCategories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>客製化設定</Label>
                      <Input
                        placeholder="例：麵硬、湯濃、蔥多"
                        value={item.customization || ""}
                        onChange={(e) => {
                          const updated = [...ramenItems];
                          updated[index].customization = e.target.value;
                          setRamenItems(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {ramenItems.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addRamenItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增拉麵品項
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 副餐、小菜 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                副餐、小菜 (0-10個)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sideItems.map((item, index) => (
                <div
                  key={`side-${item.name || "unnamed"}-${index}`}
                  className="space-y-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">副餐 #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSideItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>品項名稱 *</Label>
                      <Input
                        placeholder="例：溏心蛋"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...sideItems];
                          updated[index].name = e.target.value;
                          setSideItems(updated);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>價格 *</Label>
                      <Input
                        type="number"
                        placeholder="130"
                        value={item.price || ""}
                        onChange={(e) => {
                          const updated = [...sideItems];
                          updated[index].price =
                            Number.parseInt(e.target.value) || 0;
                          setSideItems(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {sideItems.length < 10 && (
                <Button
                  variant="outline"
                  onClick={addSideItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增副餐品項
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 標籤 */}
          <Card>
            <CardHeader>
              <CardTitle>標籤</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>評價標籤</Label>
                <MultipleSelector
                  value={selectedTags}
                  onChange={setSelectedTags}
                  defaultOptions={recommendedTags}
                  placeholder="選擇或輸入標籤..."
                  creatable
                  emptyIndicator={
                    <p className="text-center text-sm leading-10 text-gray-600 dark:text-gray-400">
                      沒有找到相關標籤，輸入新標籤並按Enter創建
                    </p>
                  }
                />
                {recommendedTags.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    💡 推薦標籤基於您在此餐廳的歷史評價
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 照片上傳 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                照片上傳 (最多10張)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 現有照片 */}
              {existingPhotos.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">現有照片</Label>
                  <div className="grid gap-4 md:grid-cols-2 mt-2">
                    {existingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="space-y-2 p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {photo.filename}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeExistingPhoto(photo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          分類:{" "}
                          {photoCategoryReverseMapping[photo.category] ||
                            photo.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          大小: {(photo.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 新照片上傳 */}
              <div>
                <Label className="text-sm font-medium">新增照片</Label>
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  {photos.map((photo, index) => (
                    <div
                      key={`photo-${photo.file.name}-${photo.file.size}`}
                      className="space-y-2 p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {photo.file.name}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePhoto(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">照片分類</Label>
                        <Select
                          value={photo.category}
                          onValueChange={(value) =>
                            updatePhotoCategory(index, value)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {photoCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">照片說明</Label>
                        <Input
                          placeholder="選填"
                          value={photo.description || ""}
                          onChange={(e) =>
                            updatePhotoDescription(index, e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {photos.length + existingPhotos.length < 10 && (
                  <div className="mt-4">
                    <Label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">點擊上傳照片</p>
                        <p className="text-xs text-gray-400">
                          支援 JPG、PNG，最大 5MB
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 文字評價 */}
          <Card>
            <CardHeader>
              <CardTitle>文字評價</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="text-review">評價內容 *</Label>
                <Textarea
                  id="text-review"
                  placeholder="分享您的用餐體驗..."
                  value={textReview}
                  onChange={(e) => setTextReview(e.target.value)}
                  className="min-h-[120px]"
                  maxLength={1000}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {textReview.length}/1000 字
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 側邊欄 */}
        <div className="space-y-6">
          {/* 餐廳資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                餐廳資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {restaurant.prefecture}
                    {restaurant.city}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>〒{restaurant.postalCode}</p>
                  <p>{restaurant.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最寄駅選擇 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5" />
                最寄駅
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingStations ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : stations.length > 0 ? (
                  <div className="space-y-2">
                    <Label>選擇最近的車站</Label>
                    <Select
                      value={selectedStation?.placeId || ""}
                      onValueChange={(value) => {
                        const station = stations.find(
                          (s) => s.placeId === value
                        );
                        setSelectedStation(station || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇車站" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem
                            key={station.placeId}
                            value={station.placeId}
                          >
                            {station.name} (步行 {station.walkingTime} 分鐘)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStation && (
                      <p className="text-sm text-muted-foreground">
                        從 {restaurant.name} 步行至 {selectedStation.name} 約需{" "}
                        {selectedStation.walkingTime} 分鐘
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    附近沒有找到火車站（20分鐘步行範圍內）
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按鈕 */}
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "更新中..." : "更新評價"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isSaving}
                className="w-full"
              >
                儲存草稿
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/reviews")}
                className="w-full"
              >
                取消編輯
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 照片裁切 Modal */}
      {cropModalOpen && currentPhotoIndex !== null && (
        <PhotoCropModal
          photo={photos[currentPhotoIndex]}
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          onCropComplete={(croppedFile) => {
            const updated = [...photos];
            updated[currentPhotoIndex].file = croppedFile;
            setPhotos(updated);
            setCropModalOpen(false);
            setCurrentPhotoIndex(null);
          }}
        />
      )}
    </div>
  );
}

export default function EditReviewPage({
  params,
}: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <EditReviewPageContentWrapper params={params} />
    </Suspense>
  );
}

function EditReviewPageContentWrapper({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <EditReviewPageContent reviewId={id} />;
}
