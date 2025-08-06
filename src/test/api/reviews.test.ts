import { DELETE, PUT, GET as getById } from "@/app/api/reviews/[id]/route";
import { GET, POST } from "@/app/api/reviews/route";
import { prisma } from "@/lib/prisma";
import { RamenCategory } from "@prisma/client";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRequest } from "../helpers";

// 測試資料清理
async function cleanupTestData() {
  await prisma.review.deleteMany({
    where: {
      restaurant: {
        name: {
          startsWith: "TEST_",
        },
      },
    },
  });
  await prisma.restaurant.deleteMany({
    where: {
      name: {
        startsWith: "TEST_",
      },
    },
  });
}

describe("評價 API 測試", () => {
  let testRestaurant: { id: string; name: string };

  beforeEach(async () => {
    await cleanupTestData();

    // 建立測試餐廳
    testRestaurant = await prisma.restaurant.create({
      data: {
        name: "TEST_評價測試餐廳",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500002",
        address: "東京都渋谷区渋谷1-1-1",
      },
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe("POST /api/reviews", () => {
    it("應該能夠建立新評價", async () => {
      const reviewData = {
        restaurantId: testRestaurant.id,
        visitDate: "2024-01-15T12:00:00.000Z",
        visitTime: "12:30",
        partySize: 2,
        reservationStatus: "無需排隊",
        orderMethod: "食券機",
        paymentMethods: ["現金"],
        ramenItems: [
          {
            name: "TEST_醬油拉麵",
            price: 800,
            category: RamenCategory.SHOYU,
            customization: "大盛り",
          },
        ],
        sideItems: [
          {
            name: "TEST_餃子",
            price: 300,
          },
        ],
        tags: ["美味", "推薦"],
        textReview:
          "這家拉麵店的醬油拉麵非常好吃，湯頭清爽不油膩，麵條有彈性。餃子也很香酥可口，整體用餐體驗很棒！",
      };

      const request = createRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.restaurantId).toBe(testRestaurant.id);
      expect(data.textReview).toBe(reviewData.textReview);
      expect(data.ramenItems).toHaveLength(1);
      expect(data.sideItems).toHaveLength(1);
      expect(data.tags).toHaveLength(2);
    });

    it("應該驗證必填欄位", async () => {
      const invalidData = {
        restaurantId: testRestaurant.id,
        visitDate: "2024-01-15T12:00:00.000Z",
        visitTime: "12:30",
        partySize: 2,
        reservationStatus: "無需排隊",
        orderMethod: "食券機",
        paymentMethods: ["現金"],
        ramenItems: [], // 空的拉麵品項
        textReview: "測試", // 太短的評價
      };

      const request = createRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("資料驗證失敗");
    });

    it("應該驗證排隊等候時的等待時間", async () => {
      const invalidData = {
        restaurantId: testRestaurant.id,
        visitDate: "2024-01-15T12:00:00.000Z",
        visitTime: "12:30",
        partySize: 2,
        reservationStatus: "排隊等候",
        // 缺少 waitTime
        orderMethod: "食券機",
        paymentMethods: ["現金"],
        ramenItems: [
          {
            name: "TEST_醬油拉麵",
            price: 800,
            category: RamenCategory.SHOYU,
          },
        ],
        textReview: "這家拉麵店很好吃，值得排隊等候！",
      };

      const request = createRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("選擇排隊等候時必須填寫等待時間");
    });

    it("應該驗證餐廳存在性", async () => {
      const invalidData = {
        restaurantId: "nonexistent-restaurant-id",
        visitDate: "2024-01-15T12:00:00.000Z",
        visitTime: "12:30",
        partySize: 2,
        reservationStatus: "無需排隊",
        orderMethod: "食券機",
        paymentMethods: ["現金"],
        ramenItems: [
          {
            name: "TEST_醬油拉麵",
            price: 800,
            category: RamenCategory.SHOYU,
          },
        ],
        textReview: "這家拉麵店很好吃！",
      };

      const request = createRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("找不到指定的餐廳");
    });
  });

  describe("GET /api/reviews", () => {
    beforeEach(async () => {
      // 建立測試評價
      await prisma.review.create({
        data: {
          restaurantId: testRestaurant.id,
          visitDate: new Date("2024-01-15"),
          visitTime: "12:30",
          partySize: 2,
          reservationStatus: "無需排隊",
          orderMethod: "食券機",
          paymentMethod: "現金",
          textReview: "測試評價內容",
          ramenItems: {
            create: [
              {
                name: "TEST_醬油拉麵",
                price: 800,
                category: RamenCategory.SHOYU,
              },
            ],
          },
        },
      });
    });

    it("應該能夠取得評價清單", async () => {
      const request = createRequest("http://localhost:3000/api/reviews");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviews).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.reviews.length).toBeGreaterThan(0);
    });

    it("應該能夠依餐廳篩選評價", async () => {
      const request = createRequest(
        `http://localhost:3000/api/reviews?restaurantId=${testRestaurant.id}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.reviews.every(
          (r: { restaurantId: string }) => r.restaurantId === testRestaurant.id
        )
      ).toBe(true);
    });

    it("應該支援排序", async () => {
      const request = createRequest(
        "http://localhost:3000/api/reviews?sortBy=visitDate&sortOrder=asc"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviews).toBeDefined();
    });
  });

  describe("GET /api/reviews/[id]", () => {
    let testReview: { id: string };

    beforeEach(async () => {
      testReview = await prisma.review.create({
        data: {
          restaurantId: testRestaurant.id,
          visitDate: new Date("2024-01-15"),
          visitTime: "12:30",
          partySize: 2,
          reservationStatus: "無需排隊",
          orderMethod: "食券機",
          paymentMethod: "現金",
          textReview: "測試評價內容",
          ramenItems: {
            create: [
              {
                name: "TEST_醬油拉麵",
                price: 800,
                category: RamenCategory.SHOYU,
              },
            ],
          },
        },
      });
    });

    it("應該能夠取得特定評價詳細資料", async () => {
      const response = await getById(
        createRequest(`http://localhost:3000/api/reviews/${testReview.id}`),
        { params: { id: testReview.id } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testReview.id);
      expect(data.restaurant).toBeDefined();
      expect(data.ramenItems).toBeDefined();
    });

    it("應該處理不存在的評價ID", async () => {
      const response = await getById(
        createRequest("http://localhost:3000/api/reviews/nonexistent"),
        { params: { id: "nonexistent" } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("找不到指定的評價");
    });
  });

  describe("PUT /api/reviews/[id]", () => {
    let testReview: { id: string };

    beforeEach(async () => {
      testReview = await prisma.review.create({
        data: {
          restaurantId: testRestaurant.id,
          visitDate: new Date("2024-01-15"),
          visitTime: "12:30",
          partySize: 2,
          reservationStatus: "無需排隊",
          orderMethod: "食券機",
          paymentMethod: "現金",
          textReview: "原始評價內容",
          ramenItems: {
            create: [
              {
                name: "TEST_醬油拉麵",
                price: 800,
                category: RamenCategory.SHOYU,
              },
            ],
          },
        },
      });
    });

    it("應該能夠更新評價資訊", async () => {
      const updateData = {
        textReview: "更新後的評價內容",
        partySize: 3,
        ramenItems: [
          {
            name: "TEST_味噌拉麵",
            price: 850,
            category: RamenCategory.MISO,
          },
        ],
      };

      const request = createRequest(
        `http://localhost:3000/api/reviews/${testReview.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testReview.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.textReview).toBe(updateData.textReview);
      expect(data.partySize).toBe(updateData.partySize);
    });
  });

  describe("DELETE /api/reviews/[id]", () => {
    let testReview: { id: string };

    beforeEach(async () => {
      testReview = await prisma.review.create({
        data: {
          restaurantId: testRestaurant.id,
          visitDate: new Date("2024-01-15"),
          visitTime: "12:30",
          partySize: 2,
          reservationStatus: "無需排隊",
          orderMethod: "食券機",
          paymentMethod: "現金",
          textReview: "待刪除評價內容",
        },
      });
    });

    it("應該能夠刪除評價", async () => {
      const response = await DELETE(
        createRequest(`http://localhost:3000/api/reviews/${testReview.id}`),
        { params: { id: testReview.id } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("評價已成功刪除");

      // 驗證評價已被刪除
      const deletedReview = await prisma.review.findUnique({
        where: { id: testReview.id },
      });
      expect(deletedReview).toBeNull();
    });
  });
});
