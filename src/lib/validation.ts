import { PhotoCategory, RamenCategory } from "@prisma/client";
import { z } from "zod";

// 通用驗證規則
export const ValidationRules = {
  // 字串長度限制
  restaurantName: z
    .string()
    .min(1, "店名不能為空")
    .max(100, "店名長度不能超過100字"),
  prefecture: z.string().min(1, "都道府縣不能為空").max(10, "都道府縣格式錯誤"),
  city: z
    .string()
    .min(1, "市區町村不能為空")
    .max(50, "市區町村長度不能超過50字"),
  address: z.string().min(1, "地址不能為空").max(200, "地址長度不能超過200字"),
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, "郵遞區號格式錯誤（例：1234567 或 123-4567）"),

  // 評價相關驗證
  textReview: z
    .string()
    .min(10, "評價內容至少需要10個字")
    .max(1000, "評價內容不能超過1000字"),
  partySize: z
    .number()
    .int()
    .min(1, "用餐人數必須至少1人")
    .max(15, "用餐人數過多"),
  waitTime: z
    .number()
    .int()
    .min(0, "等待時間不能為負數")
    .max(480, "等待時間過長"),

  // 品項相關驗證
  itemName: z
    .string()
    .min(1, "品項名稱不能為空")
    .max(50, "品項名稱不能超過50字"),
  price: z.number().int().min(0, "價格必須大於等於0").max(10000, "價格過高"),
  customization: z.string().max(100, "客製化設定不能超過100字").optional(),

  // 標籤驗證
  tagName: z
    .string()
    .min(1, "標籤名稱不能為空")
    .max(20, "標籤名稱不能超過20字"),

  // 照片相關驗證
  filename: z.string().min(1, "檔案名稱不能為空").max(255, "檔案名稱過長"),
  filePath: z.string().min(1, "檔案路徑不能為空").max(500, "檔案路徑過長"),
  fileSize: z
    .number()
    .int()
    .min(1, "檔案大小必須大於0")
    .max(5 * 1024 * 1024, "檔案大小不能超過5MB"),
  photoDescription: z.string().max(200, "照片說明不能超過200字").optional(),

  // 時間相關驗證
  visitDate: z.string().datetime("造訪日期格式錯誤"),
  visitTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "造訪時間格式錯誤 (HH:MM)"),
};

// 枚舉驗證
export const EnumValidation = {
  ramenCategory: z.nativeEnum(RamenCategory),
  photoCategory: z.nativeEnum(PhotoCategory),
  reservationStatus: z.enum(["無需排隊", "排隊等候", "事前預約", "記名制"]),
  orderMethod: z.enum(["食券機", "注文制", "其他"]),
  paymentMethods: z
    .array(z.enum(["現金", "QR決済", "交通系IC", "信用卡"]))
    .min(1, "必須選擇至少一種付款方式"),
};

// 複合驗證 Schema
export const RestaurantSchema = {
  create: z.object({
    name: ValidationRules.restaurantName,
    prefecture: ValidationRules.prefecture,
    city: ValidationRules.city,
    postalCode: ValidationRules.postalCode,
    address: ValidationRules.address,
    googleId: z.string().optional(),
  }),

  update: z.object({
    name: ValidationRules.restaurantName.optional(),
    prefecture: ValidationRules.prefecture.optional(),
    city: ValidationRules.city.optional(),
    postalCode: ValidationRules.postalCode.optional(),
    address: ValidationRules.address.optional(),
    googleId: z.string().optional(),
  }),
};

export const RamenItemSchema = {
  create: z.object({
    name: ValidationRules.itemName,
    price: ValidationRules.price,
    category: EnumValidation.ramenCategory,
    customization: ValidationRules.customization,
  }),

  update: z.object({
    id: z.string().optional(),
    name: ValidationRules.itemName,
    price: ValidationRules.price,
    category: EnumValidation.ramenCategory,
    customization: ValidationRules.customization,
  }),
};

export const SideItemSchema = {
  create: z.object({
    name: ValidationRules.itemName,
    price: ValidationRules.price,
  }),

  update: z.object({
    id: z.string().optional(),
    name: ValidationRules.itemName,
    price: ValidationRules.price,
  }),
};

export const PhotoSchema = {
  create: z.object({
    filename: ValidationRules.filename,
    path: ValidationRules.filePath,
    category: EnumValidation.photoCategory,
    size: ValidationRules.fileSize,
    description: ValidationRules.photoDescription,
  }),

  update: z.object({
    id: z.string().optional(),
    filename: ValidationRules.filename,
    path: ValidationRules.filePath,
    category: EnumValidation.photoCategory,
    size: ValidationRules.fileSize,
    description: ValidationRules.photoDescription,
  }),
};

export const ReviewSchema = {
  create: z.object({
    restaurantId: z.string().min(1, "餐廳ID不能為空"),
    visitDate: ValidationRules.visitDate,
    visitTime: ValidationRules.visitTime,
    partySize: ValidationRules.partySize,
    reservationStatus: EnumValidation.reservationStatus,
    waitTime: ValidationRules.waitTime.optional(),
    orderMethod: EnumValidation.orderMethod,
    paymentMethods: EnumValidation.paymentMethods,
    ramenItems: z
      .array(RamenItemSchema.create)
      .min(1, "必須至少有一個拉麵品項")
      .max(5, "拉麵品項不能超過5個"),
    sideItems: z.array(SideItemSchema.create).max(10, "副餐品項不能超過10個"),
    tags: z.array(ValidationRules.tagName).optional(),
    textReview: ValidationRules.textReview,
    photos: z.array(PhotoSchema.create).optional(),
  }),

  update: z.object({
    visitDate: ValidationRules.visitDate.optional(),
    visitTime: ValidationRules.visitTime.optional(),
    partySize: ValidationRules.partySize.optional(),
    reservationStatus: EnumValidation.reservationStatus.optional(),
    waitTime: ValidationRules.waitTime.optional(),
    orderMethod: EnumValidation.orderMethod.optional(),
    paymentMethods: EnumValidation.paymentMethods.optional(),
    ramenItems: z
      .array(RamenItemSchema.update)
      .min(1, "必須至少有一個拉麵品項")
      .max(5, "拉麵品項不能超過5個")
      .optional(),
    sideItems: z
      .array(SideItemSchema.update)
      .max(10, "副餐品項不能超過10個")
      .optional(),
    tags: z.array(ValidationRules.tagName).optional(),
    textReview: ValidationRules.textReview.optional(),
    photos: z.array(PhotoSchema.update).optional(),
  }),
};

// 搜尋參數驗證
export const SearchSchema = {
  restaurants: z.object({
    search: z.string().optional(),
    prefecture: z.string().optional(),
    city: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),

  reviews: z.object({
    restaurantId: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(["visitDate", "createdAt", "updatedAt"])
      .default("visitDate"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),

  places: z.object({
    query: z.string().min(1, "搜尋關鍵字不能為空"),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    radius: z.number().min(1).max(50000).optional(),
  }),
};

// 自定義驗證函數
export function validateReservationAndWaitTime(
  reservationStatus: string,
  waitTime?: number
): boolean {
  if (reservationStatus === "排隊等候") {
    return waitTime !== undefined && waitTime > 0;
  }
  return true;
}

export function validateRamenCategories(categories: string[]): boolean {
  const validCategories = Object.values(RamenCategory);
  return categories.every((category) =>
    validCategories.includes(category as RamenCategory)
  );
}

export function validatePhotoCategories(categories: string[]): boolean {
  const validCategories = Object.values(PhotoCategory);
  return categories.every((category) =>
    validCategories.includes(category as PhotoCategory)
  );
}

// 錯誤處理器
export function formatValidationError(error: z.ZodError) {
  return {
    message: "資料驗證失敗",
    errors: error.errors.map((err: z.ZodIssue) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    })),
  };
}
