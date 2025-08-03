"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Phone, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  prefecture: string;
  city: string;
  postalCode: string;
  rating?: number;
  priceLevel?: number;
  phoneNumber?: string;
  openingHours?: string[];
  photoUrl?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // 使用 Google Places API 搜尋
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(searchTerm + " 拉麵")}&location=35.6762,139.6503`
      );
      
      if (!response.ok) {
        throw new Error("搜尋失敗");
      }

      const data = await response.json();
      
      if (data.success && data.places) {
        setResults(data.places);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("搜尋錯誤:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatStandardAddress = (restaurant: Restaurant) => {
    return restaurant.address.replace(restaurant.postalCode, "").trim();
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    try {
      // 先將餐廳資料儲存到資料庫
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: restaurant.name,
          prefecture: restaurant.prefecture,
          city: restaurant.city,
          postalCode: restaurant.postalCode,
          address: formatStandardAddress(restaurant),
          googleId: restaurant.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 導向評價建立頁面，並帶上餐廳 ID
        router.push(`/reviews/new?restaurantId=${data.restaurant.id}`);
      } else {
        console.error("儲存餐廳失敗:", data.error);
        alert("儲存餐廳資料失敗，請重試");
      }
    } catch (error) {
      console.error("選擇餐廳錯誤:", error);
      alert("選擇餐廳時發生錯誤，請重試");
    }
  };

  const handleViewDetails = async (restaurant: Restaurant) => {
    try {
      // 使用 Google Places Details API 取得詳細資訊
      const response = await fetch(
        `/api/places/details?placeId=${restaurant.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("餐廳詳細資訊:", data);
        // 這裡可以開啟一個詳細資訊的 modal 或導向詳細頁面
        alert(`餐廳詳細資訊：\n${JSON.stringify(data.place, null, 2)}`);
      } else {
        alert("取得詳細資訊失敗");
      }
    } catch (error) {
      console.error("查看詳情錯誤:", error);
      alert("查看詳情時發生錯誤");
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">搜尋日本拉麵店</h1>
        <p className="text-muted-foreground">
          使用 Google Places API 搜尋日本境內的拉麵店資訊
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜尋拉麵店
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="輸入店名、地區或關鍵字..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "搜尋中..." : "搜尋"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">搜尋結果</h2>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasSearched && !isLoading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            搜尋結果 ({results.length} 間店舖)
          </h2>

          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">找不到相關結果</p>
                <p className="text-muted-foreground">
                  請嘗試使用不同的關鍵字或檢查拼寫
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 bg-muted rounded flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {restaurant.name}
                        </h3>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{formatStandardAddress(restaurant)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              〒{restaurant.postalCode}
                            </span>
                            <span>
                              {restaurant.prefecture} {restaurant.city}
                            </span>
                          </div>

                          {restaurant.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{restaurant.rating}</span>
                            </div>
                          )}

                          {restaurant.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{restaurant.phoneNumber}</span>
                            </div>
                          )}

                          {restaurant.openingHours && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{restaurant.openingHours.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectRestaurant(restaurant)}
                        >
                          選擇此店舖
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(restaurant)}
                        >
                          查看詳情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">開始搜尋拉麵店</p>
            <p className="text-muted-foreground">
              輸入店名、地區或關鍵字來搜尋日本境內的拉麵店
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
