// 測試用的 Mock 資料常數

export const MOCK_RESTAURANT_DATA = {
  name: "測試拉麵店",
  prefecture: "東京都",
  city: "渋谷区",
  postalCode: "1500013",
  address: "恵比寿1-1-1",
  googleId: () => `test-google-id-${Date.now()}`, // 使用函數避免重複ID
} as const;

export const MOCK_REVIEW_DATA = {
  visitDate: () => new Date().toISOString(),
  visitTime: "12:30",
  partySize: 2,
  reservationStatus: "事前預約",
  waitTime: null,
  orderMethod: "食券機",
  paymentMethods: ["現金"],
  ramenItems: [
    {
      name: "醬油拉麵",
      price: 800,
      category: "SHOYU",
      customization: "",
    },
  ],
  sideItems: [],
  tags: [],
  textReview: "測試評價內容",
  nearestStation: "恵比寿駅",
  walkingTime: 3,
  stationPlaceId: "ChIJHffjRkCLGGAR304p75Idq4U",
  photos: [],
  isDraft: false,
} as const;

// 輔助函數：建立測試餐廳資料
export function createMockRestaurantData() {
  return {
    ...MOCK_RESTAURANT_DATA,
    googleId: MOCK_RESTAURANT_DATA.googleId(),
  };
}

// 輔助函數：建立測試評價資料
export function createMockReviewData(restaurantId: string) {
  return {
    ...MOCK_REVIEW_DATA,
    restaurantId,
    visitDate: MOCK_REVIEW_DATA.visitDate(),
  };
}
