import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Google Place Details API 參數驗證 schema
const PlaceDetailsSchema = z.object({
  placeId: z.string().min(1, "Place ID 不能為空"),
});

// Google Place Details API 回應的型別定義
interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetails;
  status: string;
  error_message?: string;
}

// 日本地址解析函數 (與搜尋 API 相同)
function parseJapaneseAddress(address: string) {
  const cleanAddress = address.replace(/^日本、/, "").replace(/^Japan,\s*/, "");

  const prefectureRegex =
    /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;
  const prefectureMatch = cleanAddress.match(prefectureRegex);
  const prefecture = prefectureMatch ? prefectureMatch[1] : "";

  const postalCodeRegex = /〒(\d{7}|\d{3}-\d{4})/;
  const postalCodeMatch = cleanAddress.match(postalCodeRegex);
  let postalCode = "";
  if (postalCodeMatch) {
    postalCode = postalCodeMatch[1].replace("-", "");
  }

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

// GET /api/places/details - 取得特定場所的詳細資訊
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json({ error: "Place ID 為必填" }, { status: 400 });
    }

    // 驗證輸入參數
    const validatedData = PlaceDetailsSchema.parse({ placeId });

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API 金鑰未設定" },
        { status: 500 }
      );
    }

    // 指定要取得的欄位
    const fields = [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "geometry",
      "opening_hours",
      "photos",
      "rating",
      "user_ratings_total",
      "price_level",
      "types",
      "reviews",
    ].join(",");

    // 建構 Google Place Details API 請求 URL
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${validatedData.placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp`;

    // 呼叫 Google Place Details API
    const response = await fetch(apiUrl);
    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Google Place Details API 錯誤:", data.error_message);
      return NextResponse.json(
        {
          error: "Google Place Details API 請求失敗",
          details: data.error_message,
        },
        { status: 500 }
      );
    }

    const place = data.result;
    const addressInfo = parseJapaneseAddress(place.formatted_address);

    // 處理營業時間
    const openingHours = place.opening_hours
      ? {
          openNow: place.opening_hours.open_now,
          weekdayText: place.opening_hours.weekday_text,
          periods: place.opening_hours.periods,
        }
      : null;

    // 處理照片
    const photos = place.photos?.map((photo) => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${photo.width}&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
    }));

    // 處理評論
    const reviews = place.reviews?.map((review) => ({
      authorName: review.author_name,
      rating: review.rating,
      text: review.text,
      time: new Date(review.time * 1000).toISOString(),
    }));

    const restaurantDetails = {
      googleId: place.place_id,
      name: place.name,
      prefecture: addressInfo.prefecture,
      city: addressInfo.city,
      postalCode: addressInfo.postalCode,
      address: addressInfo.address,
      fullAddress: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      openingHours,
      photos,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      reviews,
    };

    return NextResponse.json(restaurantDetails);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.errors },
        { status: 400 }
      );
    }

    console.error("取得餐廳詳細資訊失敗:", error);
    return NextResponse.json(
      { error: "取得餐廳詳細資訊失敗" },
      { status: 500 }
    );
  }
}
