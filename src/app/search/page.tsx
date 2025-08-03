"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Phone, Search, Star } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    // 模擬 API 搜尋延遲
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 模擬搜尋結果
    const mockResults: Restaurant[] = [
      {
        id: "1",
        name: "一蘭拉麵 渋谷店",
        address: "東京都渋谷区宇田川町13-8",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500042",
        rating: 4.2,
        priceLevel: 2,
        phoneNumber: "03-3461-1766",
        openingHours: ["週一至週日 24小時營業"],
      },
      {
        id: "2",
        name: "麺や 七彩",
        address: "東京都台東区浅草橋5-9-2",
        prefecture: "東京都",
        city: "台東区",
        postalCode: "1110053",
        rating: 4.5,
        priceLevel: 2,
        phoneNumber: "03-3851-3957",
        openingHours: ["11:00-15:00", "18:00-21:00"],
      },
      {
        id: "3",
        name: "らーめん 大至急",
        address: "東京都新宿区歌舞伎町1-6-2",
        prefecture: "東京都",
        city: "新宿区",
        postalCode: "1600021",
        rating: 4.1,
        priceLevel: 1,
        phoneNumber: "03-3205-1234",
        openingHours: ["11:30-03:00"],
      },
    ];

    setResults(mockResults);
    setIsLoading(false);
  };

  const formatStandardAddress = (restaurant: Restaurant) => {
    return restaurant.address.replace(restaurant.postalCode, "").trim();
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
                        <Button size="sm">選擇此店舖</Button>
                        <Button variant="outline" size="sm">
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
