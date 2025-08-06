import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 車站搜尋參數驗證 schema
const SearchStationsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(1).max(20000).default(1500), // 預設1.5公里（約徒步20分鐘）
});

// Google Places API 回應的型別定義
interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
}

// GET /api/stations/search - 搜尋附近的車站
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");

    if (!lat || !lng) {
      return NextResponse.json({ error: "經緯度為必填" }, { status: 400 });
    }

    // 驗證輸入參數
    const validatedData = SearchStationsSchema.parse({
      lat: Number.parseFloat(lat),
      lng: Number.parseFloat(lng),
      radius: radius ? Number.parseInt(radius) : 1500,
    });

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API 金鑰未設定" },
        { status: 500 }
      );
    }

    // 建構 Google Places API 請求 URL - 搜尋附近的電車站
    // 使用 train_station 類型來專門搜尋鐵道車站，排除公車站等其他交通設施
    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${validatedData.lat},${validatedData.lng}&radius=${validatedData.radius}&type=train_station&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp`;

    // 呼叫 Google Places API
    const response = await fetch(apiUrl);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places API 錯誤:", data.error_message);

      // 如果是計費或API金鑰問題，使用mock資料
      if (
        data.error_message?.includes("Billing") ||
        data.error_message?.includes("API key")
      ) {
        console.warn("Google Places API 不可用，使用 mock 資料");
        const mockStations = [
          {
            placeId: "mock_station_1",
            name: "渋谷駅",
            address: "東京都渋谷区道玄坂1丁目",
            location: {
              lat: validatedData.lat + 0.002,
              lng: validatedData.lng + 0.002,
            },
            types: ["train_station", "subway_station", "establishment"],
          },
          {
            placeId: "mock_station_2",
            name: "表参道駅",
            address: "東京都港区北青山3丁目",
            location: {
              lat: validatedData.lat - 0.003,
              lng: validatedData.lng + 0.001,
            },
            types: ["subway_station", "establishment"],
          },
          {
            placeId: "mock_station_3",
            name: "原宿駅",
            address: "東京都渋谷区神宮前1丁目",
            location: {
              lat: validatedData.lat + 0.001,
              lng: validatedData.lng - 0.002,
            },
            types: ["train_station", "establishment"],
          },
        ];

        return NextResponse.json({
          stations: mockStations,
          total: mockStations.length,
          note: "使用模擬資料（Google Places API 暫時不可用）",
        });
      }

      return NextResponse.json(
        { error: "Google Places API 搜尋失敗", details: data.error_message },
        { status: 500 }
      );
    }

    // 處理結果 - 過濾出電車站，排除公車站和其他類型
    const stations = data.results
      .filter((place) => {
        // 必須包含 train_station 類型
        const hasTrainStation = place.types.includes("train_station");
        // 可以包含 subway_station（地鐵也是電車的一種）
        const hasSubwayStation = place.types.includes("subway_station");
        // 排除純粹的公車站
        const isBusStation =
          place.types.includes("bus_station") &&
          !hasTrainStation &&
          !hasSubwayStation;

        return (hasTrainStation || hasSubwayStation) && !isBusStation;
      })
      .map((place) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
      }));

    // 去除重複的車站名稱（保留最近的一個）
    const uniqueStations = stations.reduce(
      (acc, station) => {
        const existing = acc.find((s) => s.name === station.name);
        if (!existing) {
          acc.push(station);
        }
        return acc;
      },
      [] as typeof stations
    );

    return NextResponse.json({
      stations: uniqueStations,
      total: uniqueStations.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    console.error("搜尋車站失敗:", error);
    return NextResponse.json({ error: "搜尋車站失敗" }, { status: 500 });
  }
}
