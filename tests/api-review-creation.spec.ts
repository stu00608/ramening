import { expect, test } from "@playwright/test";

test("API 建立評價應該能處理車站資訊", async ({ request }) => {
  // 查詢現有餐廳
  const existingRestaurantsResponse = await request.get("/api/restaurants");
  const existingData = await existingRestaurantsResponse.json();
  
  let restaurant;
  if (existingData.restaurants && existingData.restaurants.length > 0) {
    restaurant = existingData.restaurants[0];
    console.log("使用現有餐廳:", restaurant);
  } else {
    // 如果沒有餐廳，建立一個新的
    const restaurantResponse = await request.post("/api/restaurants", {
      data: {
        name: "測試拉麵店",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500013",
        address: "恵比寿1-1-1",
        googleId: `test-google-id-${Date.now()}`
      }
    });
    
    const restaurantResult = await restaurantResponse.json();
    console.log("餐廳建立回應:", restaurantResponse.status(), restaurantResult);
    expect(restaurantResponse.ok()).toBeTruthy();
    restaurant = restaurantResult;
  }
  
  console.log("建立的餐廳:", restaurant);
  
  // 建立包含車站資訊的評價
  const reviewData = {
    restaurantId: restaurant.id,
    visitDate: new Date().toISOString(),
    visitTime: "12:30",
    partySize: 2,
    reservationStatus: "事前預約",
    waitTime: null,
    orderMethod: "食券機",
    paymentMethods: ["現金"],
    ramenItems: [{
      name: "醬油拉麵",
      price: 800,
      category: "SHOYU",
      customization: ""
    }],
    sideItems: [],
    tags: [],
    textReview: "測試評價內容",
    nearestStation: "恵比寿駅",
    walkingTime: 3,
    stationPlaceId: "ChIJHffjRkCLGGAR304p75Idq4U",
    photos: [],
    isDraft: false
  };
  
  console.log("發送的評價資料:", JSON.stringify(reviewData, null, 2));
  
  // 發送評價建立請求
  const reviewResponse = await request.post("/api/reviews", {
    data: reviewData
  });
  
  const responseBody = await reviewResponse.json();
  
  console.log("HTTP 狀態碼:", reviewResponse.status());
  console.log("API 回應:", JSON.stringify(responseBody, null, 2));
  
  // 檢查回應
  if (!reviewResponse.ok()) {
    console.error("API 錯誤詳情:", responseBody);
  }
  
  expect(reviewResponse.status()).toBe(201);
  expect(responseBody.success).toBe(true);
  expect(responseBody.review).toBeDefined();
  expect(responseBody.review.nearestStation).toBe("恵比寿駅");
  expect(responseBody.review.walkingTime).toBe(3);
  expect(responseBody.review.stationPlaceId).toBe("ChIJHffjRkCLGGAR304p75Idq4U");
});