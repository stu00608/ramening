import type { PhotoCategory, RamenCategory } from "@prisma/client";

// 拉麵分類映射
export const RAMEN_CATEGORIES = {
  SHOYU: "醬油拉麵",
  SHIO: "鹽味拉麵",
  MISO: "味噌拉麵",
  TONKOTSU: "豚骨拉麵",
  CHICKEN: "雞白湯拉麵",
  NIBOSHI: "煮干拉麵",
  GYOKAI: "魚介拉麵",
  IEKEI: "家系拉麵",
  JIRO: "二郎系拉麵",
  TSUKEMEN: "沾麵",
  TANTANMEN: "擔擔麵",
  MAZESOBA: "油拌麵",
  HIYASHI: "冷麵",
  OTHER: "其他",
} as const;

// 照片分類映射
export const PHOTO_CATEGORIES = {
  RAMEN: "拉麵",
  SIDE: "副餐",
  EXTERIOR: "店面外觀",
  INTERIOR: "店內環境",
  MENU: "菜單",
  OTHER: "其他",
} as const;

// Google Places API 回應類型
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

// 表單資料類型
export interface ReviewFormData {
  // 造訪詳細資料
  visitDate: Date;
  visitTime: string;
  partySize: number;
  reservationStatus: string;
  waitTime?: number;

  // 點餐細節
  orderMethod: string;
  paymentMethod: string;

  // 拉麵品項
  ramenItems: Array<{
    name: string;
    price: number;
    category: RamenCategory;
    customization?: string;
  }>;

  // 副餐
  sideItems: Array<{
    name: string;
    price: number;
  }>;

  // 標籤
  tags: string[];

  // 文字評價
  textReview: string;

  // 照片
  photos: Array<{
    file: File;
    category: PhotoCategory;
  }>;
}

// Instagram 匯出格式
export interface InstagramPost {
  content: string;
  hashtags: string[];
}

export type { RamenCategory, PhotoCategory };
