"use client";

import { PhotoCropModal } from "@/components/photo-crop-modal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import {
  FORM_OPTIONS,
  LIMITS,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_MAPPING,
  RAMEN_CATEGORIES,
  SEARCH_PARAMS,
  TOAST_MESSAGES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Upload, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// 類型定義
interface Station {
  placeId: string;
  name: string;
  walkingTime?: number;
}

interface ErrorDetail {
  message: string;
  status?: number;
}

// 付款方式選項
const paymentMethods: Option[] = [...FORM_OPTIONS.PAYMENT_METHODS];

// 推薦標籤現在從餐廳歷史評價中動態載入

interface RamenItem {
  name: string;
  price: number;
  category: string;
  customization?: string;
}

interface SideItem {
  name: string;
  price: number;
}

interface PhotoUpload {
  file: File;
  category: string;
  description?: string;
}

function NewReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 餐廳資訊狀態
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    address: string;
    prefecture: string;
    city: string;
    googleId?: string;
  } | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);
  const [visitDate, setVisitDate] = useState<Date>();
  const [visitTime, setVisitTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [reservationStatus, setReservationStatus] = useState("");
  const [waitTime, setWaitTime] = useState("");
  const [orderMethod, setOrderMethod] = useState("");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    Option[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [recommendedTags, setRecommendedTags] = useState<Option[]>([]);
  const [ramenItems, setRamenItems] = useState<RamenItem[]>([
    { name: "", price: 0, category: "" },
  ]);
  const [sideItems, setSideItems] = useState<SideItem[]>([]);
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [textReview, setTextReview] = useState("");

  // 車站選擇相關狀態
  const [nearestStations, setNearestStations] = useState<
    {
      placeId: string;
      name: string;
      address: string;
      walkingTime?: number;
    }[]
  >([]);
  const [selectedStation, setSelectedStation] = useState<{
    placeId: string;
    name: string;
    walkingTime: number;
  } | null>(null);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // 照片裁切相關狀態
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [fileToProcess, setFileToProcess] = useState<File | null>(null);

  // 檢查並載入餐廳資訊
  useEffect(() => {
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      // 沒有餐廳ID，導向搜尋頁面
      router.push("/search");
      return;
    }

    // 載入餐廳資訊
    const loadRestaurant = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        if (response.ok) {
          const restaurant = await response.json();
          if (restaurant?.id) {
            setRestaurant(restaurant);
          } else {
            toast.error(TOAST_MESSAGES.ERROR.RESTAURANT_NOT_FOUND);
            router.push("/search");
          }
        } else {
          toast.error(TOAST_MESSAGES.ERROR.LOAD_RESTAURANT_FAILED);
          router.push("/search");
        }
      } catch (error) {
        console.error("載入餐廳資訊錯誤:", error);
        toast.error(TOAST_MESSAGES.ERROR.NETWORK_ERROR);
        router.push("/search");
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    loadRestaurant();
  }, [searchParams, router]);

  // 載入該餐廳的推薦標籤
  useEffect(() => {
    if (restaurant?.id) {
      const loadRecommendedTags = async () => {
        try {
          const response = await fetch(
            `/api/restaurants/${restaurant.id}/tags`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.tags) {
              const tagOptions = data.tags.map((tag: string) => ({
                value: tag,
                label: tag,
              }));
              setRecommendedTags(tagOptions);
            }
          }
        } catch (error) {
          console.error("載入推薦標籤失敗:", error);
          // 如果載入失敗，使用空陣列（不顯示推薦標籤）
          setRecommendedTags([]);
        }
      };

      loadRecommendedTags();
    }
  }, [restaurant?.id]);

  // 載入附近車站並計算徒步時間
  useEffect(() => {
    if (restaurant?.googleId) {
      const loadNearbyStations = async () => {
        setIsLoadingStations(true);
        try {
          // 首先獲取餐廳詳細資訊（包含經緯度）
          const detailsResponse = await fetch(
            `/api/places/details?placeId=${restaurant.googleId}`
          );
          if (!detailsResponse.ok) {
            throw new Error("無法獲取餐廳詳細資訊");
          }

          const restaurantDetails = await detailsResponse.json();
          const { location } = restaurantDetails;

          // 搜尋附近的車站
          const stationsResponse = await fetch(
            `/api/stations/search?lat=${location.lat}&lng=${location.lng}&radius=${SEARCH_PARAMS.STATION_SEARCH_RADIUS}`
          );

          if (!stationsResponse.ok) {
            throw new Error("無法搜尋附近車站");
          }

          const stationsData = await stationsResponse.json();
          const stations = stationsData.stations || [];

          // 限制併發請求數量，避免API限制
          const BATCH_SIZE = 3;
          const stationsWithWalkingTime = [];

          // 指數退避參數
          const INITIAL_DELAY = 100; // ms
          const MAX_DELAY = 2000; // ms
          const BACKOFF_MULTIPLIER = 2;

          // 指數退避函數
          async function exponentialBackoff<T>(
            fn: () => Promise<T>,
            maxRetries = 5
          ): Promise<T> {
            let delay = INITIAL_DELAY;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              try {
                return await fn();
              } catch (err: unknown) {
                const error = err as ErrorDetail;
                // 只對速率限制錯誤 (HTTP 429) 進行退避
                if (error && error.status === 429) {
                  if (attempt === maxRetries - 1) throw error;
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  delay = Math.min(delay * BACKOFF_MULTIPLIER, MAX_DELAY);
                } else {
                  throw error;
                }
              }
            }
            throw new Error("Max retries exceeded");
          }

          for (let i = 0; i < stations.length; i += BATCH_SIZE) {
            const batch = stations.slice(i, i + BATCH_SIZE);
            // 使用指數退避包裝批次處理
            const batchResults = await exponentialBackoff(async () => {
              return await Promise.all(
                batch.map(async (station: Station) => {
                  try {
                    const walkingResponse = await fetch(
                      `/api/directions/walking?originPlaceId=${restaurant.googleId}&destinationPlaceId=${station.placeId}`
                    );

                    if (walkingResponse.ok) {
                      const walkingData = await walkingResponse.json();
                      return {
                        ...station,
                        walkingTime: walkingData.duration.minutes,
                      };
                    }
                    if (walkingResponse.status === 429) {
                      // 拋出錯誤以觸發退避機制
                      const rateLimitError = new Error(
                        "Rate limited"
                      ) as ErrorDetail;
                      rateLimitError.status = 429;
                      throw rateLimitError;
                    }
                    return station;
                  } catch (error) {
                    console.error(
                      `計算到${station.name}的徒步時間失敗:`,
                      error
                    );
                    return station;
                  }
                })
              );
            });
            stationsWithWalkingTime.push(...batchResults);

            // 在成功後仍加一個最小延遲，避免過快
            if (i + BATCH_SIZE < stations.length) {
              await new Promise((resolve) =>
                setTimeout(resolve, INITIAL_DELAY)
              );
            }
          }

          // 過濾出指定時間內的車站並排序
          const nearbyStations = stationsWithWalkingTime
            .filter(
              (station) =>
                station.walkingTime &&
                station.walkingTime <= LIMITS.MAX_WALKING_TIME
            )
            .sort((a, b) => (a.walkingTime || 999) - (b.walkingTime || 999));

          setNearestStations(nearbyStations);
        } catch (error) {
          console.error("載入附近車站失敗:", error);
          setNearestStations([]);
        } finally {
          setIsLoadingStations(false);
        }
      };

      loadNearbyStations();
    }
  }, [restaurant?.googleId]);

  const addRamenItem = () => {
    if (ramenItems.length < LIMITS.MAX_RAMEN_ITEMS) {
      setRamenItems([...ramenItems, { name: "", price: 0, category: "" }]);
    }
  };

  const removeRamenItem = (index: number) => {
    if (ramenItems.length > LIMITS.MIN_RAMEN_ITEMS) {
      setRamenItems(ramenItems.filter((_, i) => i !== index));
    }
  };

  const updateRamenItem = (
    index: number,
    field: keyof RamenItem,
    value: string | number
  ) => {
    const updated = [...ramenItems];
    updated[index] = { ...updated[index], [field]: value };
    setRamenItems(updated);
  };

  const addSideItem = () => {
    if (sideItems.length < LIMITS.MAX_SIDE_ITEMS) {
      setSideItems([...sideItems, { name: "", price: 0 }]);
    }
  };

  const removeSideItem = (index: number) => {
    setSideItems(sideItems.filter((_, i) => i !== index));
  };

  const updateSideItem = (
    index: number,
    field: keyof SideItem,
    value: string | number
  ) => {
    const updated = [...sideItems];
    updated[index] = { ...updated[index], [field]: value };
    setSideItems(updated);
  };

  const processFileForCrop = (file: File) => {
    if (file.size > LIMITS.MAX_FILE_SIZE) {
      toast.error(TOAST_MESSAGES.ERROR.FILE_TOO_LARGE);
      return;
    }

    if (photos.length >= LIMITS.MAX_PHOTOS) {
      toast.error(TOAST_MESSAGES.ERROR.TOO_MANY_PHOTOS);
      return;
    }

    setFileToProcess(file);
    setCropModalOpen(true);
  };

  const handlePhotoUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // 處理第一個檔案進行裁切
    if (fileArray.length > 0) {
      processFileForCrop(fileArray[0]);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;
    handlePhotoUpload(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files) {
      handlePhotoUpload(files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const createImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const updatePhotoCategory = (index: number, category: string) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], category };
    setPhotos(updated);
  };

  const updatePhotoDescription = (index: number, description: string) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], description };
    setPhotos(updated);
  };

  const handleCropComplete = (croppedFile: File, category: string) => {
    setPhotos((prev) => [...prev, { file: croppedFile, category }]);
    setFileToProcess(null);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!restaurant) {
      toast.error("餐廳資訊遺失: 請重新選擇餐廳");
      return;
    }

    // 表單驗證（草稿模式不需要完整驗證）
    if (!isDraft) {
      const hasValidRamenItem = ramenItems.some(
        (item) => item.name.trim() && item.category && item.price > 0
      );

      if (!hasValidRamenItem) {
        toast.error(
          "拉麵品項未完整: 請至少填寫一個完整的拉麵品項（品項名稱、分類和價格）"
        );
        return;
      }

      if (!textReview.trim()) {
        toast.error("文字評價未填寫: 請填寫文字評價");
        return;
      }

      if (!visitDate) {
        toast.error("造訪日期未選擇: 請選擇造訪日期");
        return;
      }
    }

    // 準備提交資料
    const reviewData = {
      restaurantId: restaurant.id,
      visitDate: visitDate ? visitDate.toISOString() : null,
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
      photos: photos.map((photo) => ({
        filename: photo.file.name,
        path: `/uploads/${photo.file.name}`, // 假設照片會儲存在 uploads 目錄
        category: PHOTO_CATEGORY_MAPPING[photo.category] || "OTHER",
        size: photo.file.size,
      })),
      isDraft,
    };

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          isDraft
            ? "草稿已儲存: 草稿已儲存，可稍後繼續編輯"
            : "評價已成功建立: 評價已成功新增到系統中"
        );
        if (!isDraft) {
          router.push("/reviews");
        }
      } else {
        console.error("API錯誤詳情:", data);
        toast.error(
          `${isDraft ? "儲存草稿" : "建立評價"}失敗: ${
            data.details
              ? `${data.error}: ${data.details.map((d: ErrorDetail) => d.message).join(", ")}`
              : data.error || "發生未知錯誤"
          }`
        );
      }
    } catch (error) {
      console.error("提交評價錯誤:", error);
      toast.error(
        `${isDraft ? "儲存草稿" : "建立評價"}時發生錯誤: 請檢查網路連接並重試`
      );
    }
  };

  const handleClearForm = () => {
    if (confirm("確定要清除所有內容嗎？此操作無法復原。")) {
      setVisitDate(undefined);
      setVisitTime("");
      setGuestCount("");
      setReservationStatus("");
      setWaitTime("");
      setOrderMethod("");
      setSelectedPaymentMethods([]);
      setSelectedTags([]);
      setRamenItems([{ name: "", price: 0, category: "" }]);
      setSideItems([]);
      setPhotos([]);
      setTextReview("");
      setSelectedStation(null);
    }
  };

  // 載入中狀態
  if (isLoadingRestaurant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>載入餐廳資訊中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 沒有餐廳資訊時的狀態
  if (!restaurant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-lg mb-4">無法載入餐廳資訊</p>
          <Button onClick={() => router.push("/search")}>返回搜尋頁面</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">建立拉麵評價</h1>
        <p className="text-muted-foreground">記錄您的拉麵店造訪體驗</p>
      </div>

      {/* 選定的餐廳資訊 */}
      <Card className="mb-8 bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">
              {restaurant.address}
            </p>
            <p className="text-sm text-muted-foreground">
              {restaurant.prefecture} {restaurant.city}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* 造訪詳細資料 */}
        <Card>
          <CardHeader>
            <CardTitle>造訪詳細資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="visit-date">造訪日期時間</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
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
                          {visitDate
                            ? format(visitDate, "yyyy年M月d日")
                            : "選擇日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={visitDate}
                          onSelect={setVisitDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <TimePicker
                      value={visitTime}
                      onChange={setVisitTime}
                      placeholder="選擇時間"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-count">用餐人數</Label>
                <Select value={guestCount} onValueChange={setGuestCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇用餐人數" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}人
                      </SelectItem>
                    ))}
                    <SelectItem value="10+">10人以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-status">預約狀態</Label>
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

              {reservationStatus === "排隊等候" && (
                <div className="space-y-2">
                  <Label htmlFor="wait-time">等待時間</Label>
                  <Select value={waitTime} onValueChange={setWaitTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇等待時間" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10分鐘內</SelectItem>
                      <SelectItem value="30">30分鐘內</SelectItem>
                      <SelectItem value="60">1小時內</SelectItem>
                      <SelectItem value="120">2小時內</SelectItem>
                      <SelectItem value="150">2小時以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 點餐細節 */}
        <Card>
          <CardHeader>
            <CardTitle>點餐細節</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="order-method">點餐方式</Label>
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
                <Label>付款方式</Label>
                <MultipleSelector
                  value={selectedPaymentMethods}
                  onChange={setSelectedPaymentMethods}
                  defaultOptions={paymentMethods}
                  placeholder="選擇付款方式..."
                  emptyIndicator={<p>找不到付款方式</p>}
                  data-testid="payment-methods"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 拉麵品項 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              拉麵品項
              <Button
                onClick={addRamenItem}
                disabled={ramenItems.length >= 5}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增品項
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ramenItems.map((item, index) => (
              <div
                key={`ramen-${item.name || "unnamed"}-${index}`}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_40px] gap-4 items-end">
                  <div className="space-y-2">
                    <Label>品項名稱</Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateRamenItem(index, "name", e.target.value)
                      }
                      placeholder="例：醬油拉麵"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>價格 (¥)</Label>
                    <Input
                      type="number"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateRamenItem(
                          index,
                          "price",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>分類</Label>
                    <Select
                      value={item.category}
                      onValueChange={(value) =>
                        updateRamenItem(index, "category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇分類" />
                      </SelectTrigger>
                      <SelectContent>
                        {RAMEN_CATEGORIES.map((category) => (
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

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRamenItem(index)}
                      disabled={ramenItems.length === 1}
                      className="h-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>客製化設定（選填）</Label>
                  <Input
                    value={item.customization || ""}
                    onChange={(e) =>
                      updateRamenItem(index, "customization", e.target.value)
                    }
                    placeholder="例：麵硬、湯濃、蔥多"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 副餐、小菜 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              副餐、小菜
              <Button
                onClick={addSideItem}
                disabled={sideItems.length >= 10}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增品項
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sideItems.map((item, index) => (
              <div
                key={`side-${item.name || "unnamed"}-${index}`}
                className="border rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_40px] gap-4 items-end">
                  <div className="space-y-2">
                    <Label>品項名稱</Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateSideItem(index, "name", e.target.value)
                      }
                      placeholder="例：煎餃"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>價格 (¥)</Label>
                    <Input
                      type="number"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateSideItem(
                          index,
                          "price",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSideItem(index)}
                      className="h-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {sideItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>尚未新增副餐品項</p>
                <p className="text-sm">如有副餐或小菜，點擊「新增品項」記錄</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 照片上傳 */}
        <Card>
          <CardHeader>
            <CardTitle>照片上傳</CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-6"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {photos.length === 0 ? (
              <button
                type="button"
                className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                aria-label="上傳照片"
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">上傳照片</p>
                  <p className="text-sm text-muted-foreground">
                    點擊或拖拽照片到此區域
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支援 JPG、PNG 格式，單檔最大{" "}
                    {LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB，最多{" "}
                    {LIMITS.MAX_PHOTOS} 張
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  {photos.map((photo, index) => (
                    <div
                      key={`photo-${photo.file.name}-${photo.file.size}`}
                      className="flex-shrink-0 w-72 border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate text-sm">
                          {photo.file.name}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 照片預覽 */}
                      <div className="relative aspect-square bg-muted rounded-md overflow-hidden">
                        <img
                          src={createImagePreview(photo.file)}
                          alt={photo.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>照片分類</Label>
                          <Select
                            value={photo.category}
                            onValueChange={(value) =>
                              updatePhotoCategory(index, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHOTO_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>照片說明（選填）</Label>
                          <Input
                            value={photo.description || ""}
                            onChange={(e) =>
                              updatePhotoDescription(index, e.target.value)
                            }
                            placeholder="簡單描述照片內容..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {photos.length < 10 && (
                    <div className="flex-shrink-0 flex items-center h-full min-h-[300px]">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="h-8 w-8" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 照片裁切 Modal */}
        <PhotoCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          file={fileToProcess}
          onCropComplete={handleCropComplete}
        />

        {/* 標籤 */}
        <Card>
          <CardHeader>
            <CardTitle>標籤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>選擇標籤</Label>
              <MultipleSelector
                value={selectedTags}
                onChange={setSelectedTags}
                defaultOptions={recommendedTags}
                placeholder="選擇或建立標籤..."
                emptyIndicator={<p>找不到相關標籤</p>}
                creatable
              />
              <p className="text-sm text-muted-foreground">
                可以選擇推薦標籤或建立自訂標籤
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 最寄り駅選擇 */}
        <Card>
          <CardHeader>
            <CardTitle>最寄り駅（電車站）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingStations ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    搜尋附近電車站中...
                  </p>
                </div>
              ) : nearestStations.length > 0 ? (
                <div className="space-y-2">
                  <Label>
                    選擇最近的電車站（徒步{LIMITS.MAX_WALKING_TIME}分鐘內）
                  </Label>
                  <div className="grid gap-2">
                    {nearestStations.map((station) => (
                      <button
                        key={station.placeId}
                        type="button"
                        className={`w-full border rounded-lg p-3 transition-colors text-left ${
                          selectedStation?.placeId === station.placeId
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                        onClick={() =>
                          setSelectedStation({
                            placeId: station.placeId,
                            name: station.name,
                            walkingTime: station.walkingTime || 0,
                          })
                        }
                        aria-label={`選擇車站：${station.name}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{station.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {station.address}
                            </p>
                          </div>
                          {station.walkingTime && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                徒步{station.walkingTime}分鐘
                              </p>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : restaurant?.googleId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>找不到徒步{LIMITS.MAX_WALKING_TIME}分鐘內的電車站</p>
                  <p className="text-sm">可能此地點較為偏遠或無鐵道交通</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>無法載入車站資訊</p>
                  <p className="text-sm">餐廳缺少位置資訊</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 文字評價 */}
        <Card>
          <CardHeader>
            <CardTitle>文字評價 *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                value={textReview}
                onChange={(e) => setTextReview(e.target.value)}
                placeholder="分享您的拉麵體驗..."
                className="min-h-32"
                maxLength={LIMITS.MAX_TEXT_LENGTH}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>* 必填欄位</span>
                <span>
                  {textReview.length}/{LIMITS.MAX_TEXT_LENGTH} 字
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => handleSubmit(false)}
            className="flex-1"
            disabled={!textReview.trim()}
          >
            儲存評價
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit(true)}
          >
            儲存草稿
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearForm}
            className="sm:w-auto"
          >
            清除表單
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p>載入中...</p>
            </div>
          </div>
        </div>
      }
    >
      <NewReviewPageContent />
    </Suspense>
  );
}
