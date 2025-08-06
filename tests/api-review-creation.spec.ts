import { expect, test } from "@playwright/test";
import { createMockRestaurantData, createMockReviewData } from "./constants";

test("API 建立評價應該能處理車站資訊", async ({ request }) => {
  // 查詢現有餐廳
  const existingRestaurantsResponse = await request.get("/api/restaurants");
  const existingData = await existingRestaurantsResponse.json();

  let restaurant:
    | {
        id: string;
        name: string;
        prefecture: string;
        city: string;
        postalCode: string;
        address: string;
        googleId: string;
      }
    | undefined;
  if (existingData.restaurants && existingData.restaurants.length > 0) {
    restaurant = existingData.restaurants[0];
    console.log("使用現有餐廳:", restaurant);
  } else {
    // 如果沒有餐廳，建立一個新的
    const restaurantResponse = await request.post("/api/restaurants", {
      data: createMockRestaurantData(),
    });

    const restaurantResult = await restaurantResponse.json();
    console.log("餐廳建立回應:", restaurantResponse.status(), restaurantResult);
    expect(restaurantResponse.ok()).toBeTruthy();
    restaurant = restaurantResult;
  }

  console.log("建立的餐廳:", restaurant);

  // 建立包含車站資訊的評價
  const reviewData = createMockReviewData(restaurant.id);

  console.log("發送的評價資料:", JSON.stringify(reviewData, null, 2));

  // 發送評價建立請求
  const reviewResponse = await request.post("/api/reviews", {
    data: reviewData,
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
  expect(responseBody.review.stationPlaceId).toBe(
    "ChIJHffjRkCLGGAR304p75Idq4U"
  );
});
