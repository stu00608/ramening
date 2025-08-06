import type {
  Photo,
  RamenItem,
  Restaurant,
  Review,
  SideItem,
  Tag,
} from "@prisma/client";

// Instagram 匯出的完整評價型別
export interface InstagramReviewData extends Review {
  restaurant: Restaurant;
  ramenItems: RamenItem[];
  sideItems: SideItem[];
  tags: Tag[];
  photos?: Photo[];
}

// 地域標籤對應表
const REGION_HASHTAGS: Record<string, string[]> = {
  // 關東地區
  東京都: ["東京ラーメン", "東京美食", "東京拉麵", "東京旅遊", "東京自由行"],
  神奈川県: [
    "神奈川ラーメン",
    "神奈川美食",
    "神奈川拉麵",
    "橫濱美食",
    "鐮倉美食",
  ],
  埼玉県: ["埼玉ラーメン", "埼玉美食", "埼玉拉麵"],
  千葉県: ["千葉ラーメン", "千葉美食", "千葉拉麵"],

  // 關西地區
  大阪府: ["大阪ラーメン", "大阪美食", "大阪拉麵", "大阪旅遊", "大阪自由行"],
  京都府: ["京都ラーメン", "京都美食", "京都拉麵", "京都旅遊", "京都自由行"],
  兵庫県: ["兵庫ラーメン", "兵庫美食", "神戶美食", "神戶拉麵"],

  // 中部地區
  愛知県: ["愛知ラーメン", "名古屋ラーメン", "名古屋美食", "名古屋拉麵"],
  静岡県: ["静岡ラーメン", "静岡美食"],

  // 九州地區
  福岡県: ["福岡ラーメン", "博多ラーメン", "福岡美食", "博多美食", "九州美食"],
  熊本県: ["熊本ラーメン", "熊本美食", "九州美食"],
  鹿児島県: ["鹿児島ラーメン", "鹿児島美食", "九州美食"],

  // 北海道・東北
  北海道: ["北海道ラーメン", "札幌ラーメン", "北海道美食", "札幌美食"],

  // 其他都道府縣可以繼續添加...
};

// 預約狀態轉換
const RESERVATION_STATUS_MAP: Record<string, string> = {
  無需排隊: "無需排隊",
  排隊等候: "排隊",
  事前預約: "預約",
  記名制: "記名制",
};

// 等待時間格式化
function formatWaitTime(waitTime?: number): string {
  if (!waitTime) return "";

  if (waitTime <= 10) return "10分內";
  if (waitTime <= 30) return "30分內";
  if (waitTime <= 60) return "1小時內";
  if (waitTime <= 120) return "2小時內";
  return "2小時以上";
}

// 獲取最近車站資訊 (暫時使用地址資訊)
function getNearestStation(address: string): string {
  // 這裡可以根據實際需求整合車站資料庫或 API
  // 暫時返回簡化的地址資訊
  const stationRegex = /(.+?駅)/;
  const match = address.match(stationRegex);
  if (match) {
    return `${match[1]}周邊`;
  }

  // 如果沒有車站資訊，使用區域資訊
  const cityMatch = address.match(/(.+?[市区町村])/);
  if (cityMatch) {
    return cityMatch[1];
  }

  return "詳見地址";
}

// 拉麵品項格式化
function formatRamenItems(ramenItems: RamenItem[]): string {
  return ramenItems
    .map((item) => {
      const customization = item.customization
        ? ` (${item.customization})`
        : "";
      return `${item.name}${customization} ¥${item.price}`;
    })
    .join("\n");
}

// 副餐品項格式化
function formatSideItems(sideItems: SideItem[]): string {
  if (sideItems.length === 0) return "";

  return sideItems.map((item) => `${item.name} ¥${item.price}`).join("、");
}

// 付款方式格式化
function formatPaymentMethods(paymentMethod: string): string {
  return paymentMethod.split(", ").join("・");
}

// 用餐人數和排隊狀況格式化
function formatPartyAndQueue(
  partySize: number,
  reservationStatus: string,
  waitTime?: number
): string {
  const partyText = partySize >= 10 ? "10人以上" : `${partySize}人`;
  const queueStatus =
    RESERVATION_STATUS_MAP[reservationStatus] || reservationStatus;

  if (reservationStatus === "排隊等候" && waitTime) {
    const waitText = formatWaitTime(waitTime);
    return `${partyText} / ${queueStatus}(${waitText})`;
  }

  return `${partyText} / ${queueStatus}`;
}

// 地域標籤生成
function generateRegionHashtags(prefecture: string): string[] {
  const baseHashtags = REGION_HASHTAGS[prefecture] || [];
  return baseHashtags.slice(0, 3); // 最多取3個地域標籤
}

// 生成 Instagram 貼文內容
export function generateInstagramPost(reviewData: InstagramReviewData): string {
  const { restaurant, ramenItems, sideItems, tags } = reviewData;

  // 基本資訊
  const restaurantName = restaurant.name;
  const nearestStation = getNearestStation(restaurant.address);

  // 品項資訊
  const ramenText = formatRamenItems(ramenItems);
  const sideText = formatSideItems(sideItems);

  // 點餐和付款資訊
  const orderMethodText = reviewData.orderMethod;
  const paymentText = formatPaymentMethods(reviewData.paymentMethod);

  // 客製化資訊
  const customizations = ramenItems
    .filter((item) => item.customization)
    .map((item) => item.customization)
    .join("、");

  // 造訪資訊
  const visitDate = new Date(reviewData.visitDate)
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");

  const visitTime = reviewData.visitTime;
  const partyAndQueue = formatPartyAndQueue(
    reviewData.partySize,
    reviewData.reservationStatus,
    reviewData.waitTime || undefined
  );

  // 地域標籤
  const regionHashtags = generateRegionHashtags(restaurant.prefecture);

  // 基本標籤
  const baseHashtags = [
    "#在日台灣人",
    "#ラーメン",
    "#ラーメン好き",
    "#奶辰吃拉麵",
    "#日本拉麵",
    "#日本美食",
    "#日本旅遊",
    ...regionHashtags,
    "#好吃",
  ];

  // 建構完整貼文
  const postContent = `#${restaurantName}
📍${nearestStation}

拉麵🍜：${ramenText.replace(/\n/g, "\n拉麵🍜：")}${sideText ? `\n配菜🍥：${sideText}` : ""}
點餐💁：${orderMethodText}・(${paymentText})${customizations ? `\n客製🆓：${customizations}` : ""}
・････━━━━━━━━━━━････・

"${reviewData.textReview}"

・････━━━━━━━━━━━････・
🗾：${restaurant.address}
🗓️：${visitDate} / ${visitTime}入店 / ${partyAndQueue}
・････━━━━━━━━━━━････・
${baseHashtags.join(" ")}`;

  return postContent;
}

// 驗證評價資料完整性
export function validateReviewForExport(
  reviewData: Partial<InstagramReviewData>
): string[] {
  const errors: string[] = [];

  if (!reviewData.restaurant) {
    errors.push("缺少餐廳資訊");
  }

  if (!reviewData.ramenItems || reviewData.ramenItems.length === 0) {
    errors.push("缺少拉麵品項資訊");
  }

  if (!reviewData.textReview || reviewData.textReview.trim().length === 0) {
    errors.push("缺少文字評價");
  }

  if (!reviewData.visitDate) {
    errors.push("缺少造訪日期");
  }

  if (!reviewData.visitTime) {
    errors.push("缺少造訪時間");
  }

  return errors;
}

// 生成匯出統計資訊
export function generateExportStats(reviewData: InstagramReviewData) {
  const postContent = generateInstagramPost(reviewData);

  return {
    characterCount: postContent.length,
    hashtagCount: (postContent.match(/#/g) || []).length,
    lineCount: postContent.split("\n").length,
    hasPhotos: reviewData.photos && reviewData.photos.length > 0,
    ramenItemCount: reviewData.ramenItems.length,
    sideItemCount: reviewData.sideItems.length,
    tagCount: reviewData.tags.length,
  };
}
