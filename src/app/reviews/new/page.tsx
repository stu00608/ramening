"use client";

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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Upload, X } from "lucide-react";
import { useState } from "react";

// 拉麵分類選項
const ramenCategories = [
  "醬油拉麵",
  "鹽味拉麵",
  "味噌拉麵",
  "豚骨拉麵",
  "雞白湯拉麵",
  "煮干拉麵",
  "魚介拉麵",
  "家系拉麵",
  "二郎系拉麵",
  "沾麵",
  "擔擔麵",
  "油拌麵",
  "冷麵",
  "其他",
];

// 付款方式選項
const paymentMethods: Option[] = [
  { value: "cash", label: "現金" },
  { value: "qr", label: "QR決済" },
  { value: "ic", label: "交通系IC" },
  { value: "credit", label: "信用卡" },
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

// 推薦標籤（模擬從之前評價中獲取）
const recommendedTags: Option[] = [
  { value: "rich-broth", label: "濃厚湯頭" },
  { value: "thin-noodles", label: "細麵" },
  { value: "thick-noodles", label: "粗麵" },
  { value: "soft-egg", label: "溏心蛋" },
  { value: "char-siu", label: "叉燒" },
  { value: "green-onion", label: "蔥花" },
  { value: "bamboo-shoots", label: "筍乾" },
  { value: "spicy", label: "辛辣" },
  { value: "mild", label: "清淡" },
  { value: "late-night", label: "深夜營業" },
];

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

export default function NewReviewPage() {
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
  const [ramenItems, setRamenItems] = useState<RamenItem[]>([
    { name: "", price: 0, category: "" },
  ]);
  const [sideItems, setSideItems] = useState<SideItem[]>([]);
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [textReview, setTextReview] = useState("");

  const addRamenItem = () => {
    if (ramenItems.length < 5) {
      setRamenItems([...ramenItems, { name: "", price: 0, category: "" }]);
    }
  };

  const removeRamenItem = (index: number) => {
    if (ramenItems.length > 1) {
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
    if (sideItems.length < 10) {
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size <= 5 * 1024 * 1024) {
        // 5MB 限制
        setPhotos((prev) => [...prev, { file, category: "拉麵" }]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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

  const handleSubmit = () => {
    // 表單驗證
    const hasValidRamenItem = ramenItems.some(
      (item) => item.name.trim() && item.category && item.price > 0
    );

    if (!hasValidRamenItem) {
      alert("請至少填寫一個完整的拉麵品項（品項名稱、分類和價格）");
      return;
    }

    if (!textReview.trim()) {
      alert("請填寫文字評價");
      return;
    }

    // 這裡會處理表單提交
    // TODO: 實作實際的表單提交邏輯
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">建立拉麵評價</h1>
        <p className="text-muted-foreground">記錄您的拉麵店造訪體驗</p>
      </div>

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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
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
                  <TimePicker
                    value={visitTime}
                    onChange={setVisitTime}
                    placeholder="選擇時間"
                  />
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
                    <SelectItem value="no-queue">無需排隊</SelectItem>
                    <SelectItem value="queue">排隊等候</SelectItem>
                    <SelectItem value="reservation">事前預約</SelectItem>
                    <SelectItem value="name-list">記名制</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reservationStatus === "queue" && (
                <div className="space-y-2">
                  <Label htmlFor="wait-time">等待時間</Label>
                  <Select value={waitTime} onValueChange={setWaitTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇等待時間" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10min">10分鐘內</SelectItem>
                      <SelectItem value="30min">30分鐘內</SelectItem>
                      <SelectItem value="1hour">1小時內</SelectItem>
                      <SelectItem value="2hours">2小時內</SelectItem>
                      <SelectItem value="2hours+">2小時以上</SelectItem>
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
                    <SelectItem value="vending">食券機</SelectItem>
                    <SelectItem value="order">注文制</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
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
                key={`ramen-${index}-${item.name}`}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">品項 {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRamenItem(index)}
                    disabled={ramenItems.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {ramenCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                key={`side-${index}-${item.name}`}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">副餐 {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSideItem(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">上傳照片</p>
                <p className="text-sm text-muted-foreground">
                  支援 JPG、PNG 格式，單檔最大 5MB
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={`photo-${index}-${photo.file.name}`}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">
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
                          {photoCategories.map((category) => (
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
                ))}
              </div>
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
                maxLength={1000}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>* 必填欄位</span>
                <span>{textReview.length}/1000 字</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!textReview.trim()}
          >
            儲存評價
          </Button>
          <Button variant="outline" className="flex-1">
            儲存草稿
          </Button>
        </div>
      </div>
    </div>
  );
}
