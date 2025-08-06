// 應用程式常數配置
export const LIMITS = {
  MAX_PHOTOS: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_RAMEN_ITEMS: 5,
  MAX_SIDE_ITEMS: 10,
  MAX_WALKING_TIME: 20, // 分鐘
  MAX_TEXT_LENGTH: 1000,
  MIN_RAMEN_ITEMS: 1,
  MIN_PARTY_SIZE: 1,
  MAX_PARTY_SIZE: 9,
} as const;

// 搜尋和分頁參數
export const SEARCH_PARAMS = {
  DEFAULT_RADIUS: 10000, // 米
  DEFAULT_LAT: 35.6762, // 東京
  DEFAULT_LNG: 139.6503, // 東京
  STATION_SEARCH_RADIUS: 1500, // 米
} as const;

// 預設評分（未來會改為用戶輸入）
export const DEFAULT_RATING = 4.5;

// Toast 訊息常數
export const TOAST_MESSAGES = {
  SUCCESS: {
    REVIEW_CREATED: "評價建立成功",
    DRAFT_SAVED: "草稿儲存成功",
    REVIEW_DELETED: "評價刪除成功",
    REVIEW_UPDATED: "評價更新成功",
  },
  ERROR: {
    RESTAURANT_NOT_FOUND: "找不到指定的餐廳",
    LOAD_RESTAURANT_FAILED: "載入餐廳資訊失敗",
    LOAD_REVIEWS_FAILED: "載入評價資料失敗",
    CREATE_REVIEW_FAILED: "建立評價失敗",
    DELETE_REVIEW_FAILED: "刪除評價失敗",
    NETWORK_ERROR: "網路連線錯誤，請重試",
    VALIDATION_FAILED: "表單驗證失敗，請檢查必填欄位",
    FILE_TOO_LARGE: `檔案大小超過限制（${LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB）`,
    TOO_MANY_PHOTOS: `照片數量超過限制（${LIMITS.MAX_PHOTOS}張）`,
  },
  WARNING: {
    INCOMPLETE_RAMEN_ITEM: "請完整填寫至少一個拉麵品項的資訊",
    MISSING_TEXT_REVIEW: "請填寫文字評價內容",
    MISSING_VISIT_DATE: "請選擇造訪日期",
  },
} as const;

// 拉麵分類選項
export const RAMEN_CATEGORIES = [
  { label: "醬油拉麵", value: "SHOYU" },
  { label: "鹽味拉麵", value: "SHIO" },
  { label: "味噌拉麵", value: "MISO" },
  { label: "豚骨拉麵", value: "TONKOTSU" },
  { label: "雞白湯拉麵", value: "CHICKEN" },
  { label: "煮干拉麵", value: "NIBOSHI" },
  { label: "魚介拉麵", value: "GYOKAI" },
  { label: "家系拉麵", value: "IEKEI" },
  { label: "二郎系拉麵", value: "JIRO" },
  { label: "沾麵", value: "TSUKEMEN" },
  { label: "擔擔麵", value: "TANTANMEN" },
  { label: "油拌麵", value: "MAZESOBA" },
  { label: "冷麵", value: "HIYASHI" },
  { label: "其他", value: "OTHER" },
] as const;

// 照片分類選項和映射
export const PHOTO_CATEGORIES = [
  "拉麵",
  "副餐",
  "店內環境",
  "店家外觀",
  "菜單",
  "其他",
] as const;

export const PHOTO_CATEGORY_MAPPING: Record<string, string> = {
  拉麵: "RAMEN",
  副餐: "SIDE",
  店內環境: "INTERIOR",
  店家外觀: "EXTERIOR",
  菜單: "MENU",
  其他: "OTHER",
};

// 表單選項
export const FORM_OPTIONS = {
  GUEST_COUNT: Array.from({ length: 9 }, (_, i) => i + 1),
  RESERVATION_STATUS: ["無需排隊", "排隊等候", "事前預約", "記名制"],
  WAIT_TIME: [
    { value: "10", label: "10分鐘內" },
    { value: "30", label: "30分鐘內" },
    { value: "60", label: "1小時內" },
    { value: "120", label: "2小時內" },
    { value: "150", label: "2小時以上" },
  ],
  ORDER_METHOD: ["食券機", "注文制", "其他"],
  PAYMENT_METHODS: [
    { value: "現金", label: "現金" },
    { value: "QR決済", label: "QR決済" },
    { value: "交通系IC", label: "交通系IC" },
    { value: "信用卡", label: "信用卡" },
  ] as const,
} as const;
