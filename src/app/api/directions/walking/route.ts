import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 徒步導航參數驗證 schema
const WalkingDirectionsSchema = z.object({
  originPlaceId: z.string().optional(),
  originLat: z.number().min(-90).max(90).optional(),
  originLng: z.number().min(-180).max(180).optional(),
  destinationPlaceId: z.string().optional(),
  destinationLat: z.number().min(-90).max(90).optional(),
  destinationLng: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => 
    (data.originPlaceId || (data.originLat && data.originLng)) &&
    (data.destinationPlaceId || (data.destinationLat && data.destinationLng)),
  {
    message: "必須提供起點和終點的Place ID或經緯度",
  }
);

// Google Directions API 回應的型別定義
interface GoogleDirectionsLeg {
  distance: {
    text: string;
    value: number; // 距離（公尺）
  };
  duration: {
    text: string;
    value: number; // 時間（秒）
  };
  start_address: string;
  end_address: string;
}

interface GoogleDirectionsRoute {
  legs: GoogleDirectionsLeg[];
  overview_polyline: {
    points: string;
  };
}

interface GoogleDirectionsResponse {
  routes: GoogleDirectionsRoute[];
  status: string;
  error_message?: string;
}

// GET /api/directions/walking - 計算兩點間的徒步時間
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originPlaceId = searchParams.get("originPlaceId");
    const originLat = searchParams.get("originLat");
    const originLng = searchParams.get("originLng");
    const destinationPlaceId = searchParams.get("destinationPlaceId");
    const destinationLat = searchParams.get("destinationLat");
    const destinationLng = searchParams.get("destinationLng");

    // 準備驗證資料
    const validationData: any = {};
    if (originPlaceId) validationData.originPlaceId = originPlaceId;
    if (originLat) validationData.originLat = Number.parseFloat(originLat);
    if (originLng) validationData.originLng = Number.parseFloat(originLng);
    if (destinationPlaceId) validationData.destinationPlaceId = destinationPlaceId;
    if (destinationLat) validationData.destinationLat = Number.parseFloat(destinationLat);
    if (destinationLng) validationData.destinationLng = Number.parseFloat(destinationLng);

    // 驗證輸入參數
    const validatedData = WalkingDirectionsSchema.parse(validationData);

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Directions API 金鑰未設定" },
        { status: 500 }
      );
    }

    // 建構起點和終點
    const origin = validatedData.originPlaceId 
      ? `place_id:${validatedData.originPlaceId}`
      : `${validatedData.originLat},${validatedData.originLng}`;
    const destination = validatedData.destinationPlaceId
      ? `place_id:${validatedData.destinationPlaceId}`
      : `${validatedData.destinationLat},${validatedData.destinationLng}`;

    // 建構 Google Directions API 請求 URL
    const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&language=ja&region=jp&key=${GOOGLE_PLACES_API_KEY}`;

    // 呼叫 Google Directions API
    const response = await fetch(apiUrl);
    const data: GoogleDirectionsResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Google Directions API 錯誤:", data.error_message);
      
      // 如果是計費或API金鑰問題，計算概略時間
      if (data.error_message?.includes("Billing") || data.error_message?.includes("API key")) {
        console.warn("Google Directions API 不可用，使用概略計算");
        
        // 簡單的距離計算（僅用於fallback）
        // 如果沒有經緯度資訊，假設距離為1公里
        if (!validatedData.originLat || !validatedData.originLng || !validatedData.destinationLat || !validatedData.destinationLng) {
          const estimatedDistance = 1000; // 1公里
          const walkingMinutes = Math.round(estimatedDistance / 80);
          
          return NextResponse.json({
            distance: {
              text: `約${estimatedDistance}m`,
              value: estimatedDistance,
            },
            duration: {
              text: `約${walkingMinutes}分鐘`,
              value: walkingMinutes * 60,
              minutes: walkingMinutes,
            },
            note: "使用估計值（無法取得準確位置資訊）"
          });
        }
        
        const R = 6371000; // 地球半徑（公尺）
        const lat1Rad = (validatedData.originLat * Math.PI) / 180;
        const lat2Rad = (validatedData.destinationLat * Math.PI) / 180;
        const deltaLatRad = ((validatedData.destinationLat - validatedData.originLat) * Math.PI) / 180;
        const deltaLngRad = ((validatedData.destinationLng - validatedData.originLng) * Math.PI) / 180;

        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // 假設徒步速度為每分鐘80公尺
        const walkingMinutes = Math.round(distance / 80);
        
        return NextResponse.json({
          distance: {
            text: `${Math.round(distance)}m`,
            value: Math.round(distance),
          },
          duration: {
            text: `${walkingMinutes}分鐘`,
            value: walkingMinutes * 60,
          },
          note: "使用概略計算（Google Directions API 暫時不可用）"
        });
      }
      
      return NextResponse.json(
        { error: "Google Directions API 請求失敗", details: data.error_message },
        { status: 500 }
      );
    }

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: "找不到徒步路線" },
        { status: 404 }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // 轉換秒數為分鐘
    const durationMinutes = Math.round(leg.duration.value / 60);
    
    return NextResponse.json({
      distance: {
        text: leg.distance.text,
        value: leg.distance.value,
      },
      duration: {
        text: `${durationMinutes}分鐘`,
        value: leg.duration.value,
        minutes: durationMinutes,
      },
      startAddress: leg.start_address,
      endAddress: leg.end_address,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料驗證失敗", details: error.issues },
        { status: 400 }
      );
    }

    console.error("計算徒步時間失敗:", error);
    return NextResponse.json({ error: "計算徒步時間失敗" }, { status: 500 });
  }
}