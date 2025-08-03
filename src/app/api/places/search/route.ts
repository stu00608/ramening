import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJapaneseAddress } from "@/lib/utils";

// Google Places API 搜尋參數驗證 schema
const SearchPlacesSchema = z.object({
  query: z.string().min(1, "搜尋關鍵字不能為空"),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  radius: z.number().min(1).max(50000).optional(),
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
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
}


// GET /api/places/search - 搜尋拉麵店
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");

    if (!query) {
      return NextResponse.json({ error: "搜尋關鍵字為必填" }, { status: 400 });
    }

    // 驗證輸入參數
    const validationData: {
      query: string;
      location?: { lat: number; lng: number };
      radius?: number;
    } = { query };
    if (lat && lng) {
      validationData.location = {
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
      };
    }
    if (radius) {
      validationData.radius = Number.parseInt(radius);
    }

    const validatedData = SearchPlacesSchema.parse(validationData);

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API 金鑰未設定" },
        { status: 500 }
      );
    }

    // 建構 Google Places API 請求 URL
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${validatedData.query} ラーメン`)}&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp`;

    if (validatedData.location) {
      apiUrl += `&location=${validatedData.location.lat},${validatedData.location.lng}`;
    }

    if (validatedData.radius) {
      apiUrl += `&radius=${validatedData.radius}`;
    }

    // 呼叫 Google Places API
    const response = await fetch(apiUrl);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places API 錯誤:", data.error_message);
      return NextResponse.json(
        { error: "Google Places API 搜尋失敗", details: data.error_message },
        { status: 500 }
      );
    }

    // 過濾並處理結果 - 只顯示餐廳
    const restaurants = data.results
      .filter(
        (place) =>
          place.types.includes("restaurant") ||
          place.types.includes("meal_takeaway") ||
          place.types.includes("food")
      )
      .map((place) => {
        const addressInfo = parseJapaneseAddress(place.formatted_address);

        return {
          googleId: place.place_id,
          name: place.name,
          prefecture: addressInfo.prefecture,
          city: addressInfo.city,
          postalCode: addressInfo.postalCode,
          address: addressInfo.standardizedAddress,
          fullAddress: place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          photos: place.photos?.map((photo) => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
          })),
        };
      })
      .filter((restaurant) => restaurant.prefecture); // 只保留能解析出都道府縣的結果

    return NextResponse.json({
      restaurants,
      total: restaurants.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    console.error("搜尋餐廳失敗:", error);
    return NextResponse.json({ error: "搜尋餐廳失敗" }, { status: 500 });
  }
}
