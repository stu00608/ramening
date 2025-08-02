import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

// 日本地址解析函數
function parseJapaneseAddress(address: string) {
  // 移除 "日本、" 前綴
  const cleanAddress = address.replace(/^日本、/, "").replace(/^Japan,\s*/, "");

  // 解析都道府縣 - 包含所有47個都道府縣
  const prefectureRegex =
    /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;
  const prefectureMatch = cleanAddress.match(prefectureRegex);
  const prefecture = prefectureMatch ? prefectureMatch[1] : "";

  // 解析郵遞區號
  const postalCodeRegex = /〒(\d{7}|\d{3}-\d{4})/;
  const postalCodeMatch = cleanAddress.match(postalCodeRegex);
  let postalCode = "";
  if (postalCodeMatch) {
    postalCode = postalCodeMatch[1].replace("-", "");
  }

  // 解析市區町村 - 在都道府縣之後的第一個行政區劃
  let city = "";
  if (prefecture) {
    const afterPrefecture = cleanAddress.split(prefecture)[1];
    if (afterPrefecture) {
      const cityRegex = /^([^0-9]+?[市区町村])/;
      const cityMatch = afterPrefecture.match(cityRegex);
      if (cityMatch) {
        city = cityMatch[1];
      }
    }
  }

  // 建立標準化地址（移除郵遞區號）
  let standardizedAddress = cleanAddress;
  if (postalCodeMatch) {
    standardizedAddress = standardizedAddress
      .replace(postalCodeRegex, "")
      .trim();
  }

  return {
    prefecture,
    city,
    postalCode,
    address: standardizedAddress,
  };
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
          address: addressInfo.address,
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
        { error: "資料驗證失敗", details: error.errors },
        { status: 400 }
      );
    }

    console.error("搜尋餐廳失敗:", error);
    return NextResponse.json({ error: "搜尋餐廳失敗" }, { status: 500 });
  }
}
