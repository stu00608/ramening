import { DELETE, PUT, GET as getById } from "@/app/api/restaurants/[id]/route";
import { GET, POST } from "@/app/api/restaurants/route";
import { prisma } from "@/lib/prisma";
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


describe("餐廳 API 測試", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe("POST /api/restaurants", () => {
    it("應該能夠建立新餐廳", async () => {
      const restaurantData = {
        name: "TEST_らーめん店",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500002",
        address: "東京都渋谷区渋谷1-1-1",
        googleId: "test_google_id_001",
      };

      const request = createRequest("http://localhost:3000/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restaurantData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(restaurantData.name);
      expect(data.prefecture).toBe(restaurantData.prefecture);
      expect(data.googleId).toBe(restaurantData.googleId);
    });

    it("應該驗證必填欄位", async () => {
      const invalidData = {
        name: "",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500002",
        address: "東京都渋谷区渋谷1-1-1",
      };

      const request = createRequest("http://localhost:3000/api/restaurants", {
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

    it("應該驗證郵遞區號格式", async () => {
      const invalidData = {
        name: "TEST_らーめん店",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "123", // 無效的郵遞區號
        address: "東京都渋谷区渋谷1-1-1",
      };

      const request = createRequest("http://localhost:3000/api/restaurants", {
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

    it("應該防止重複餐廳建立", async () => {
      const restaurantData = {
        name: "TEST_重複餐廳",
        prefecture: "東京都",
        city: "渋谷区",
        postalCode: "1500002",
        address: "東京都渋谷区渋谷1-1-1",
        googleId: "test_duplicate_id",
      };

      // 建立第一個餐廳
      const request1 = createRequest("http://localhost:3000/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restaurantData),
      });

      await POST(request1);

      // 嘗試建立重複餐廳
      const request2 = createRequest("http://localhost:3000/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restaurantData),
      });

      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("此餐廳已存在");
    });
  });

  describe("GET /api/restaurants", () => {
    beforeEach(async () => {
      // 建立測試資料
      await prisma.restaurant.createMany({
        data: [
          {
            name: "TEST_東京らーめん",
            prefecture: "東京都",
            city: "渋谷区",
            postalCode: "1500002",
            address: "東京都渋谷区渋谷1-1-1",
          },
          {
            name: "TEST_大阪らーめん",
            prefecture: "大阪府",
            city: "大阪市中央区",
            postalCode: "5400028",
            address: "大阪府大阪市中央区常盤町1-1-1",
          },
        ],
      });
    });

    it("應該能夠取得餐廳清單", async () => {
      const request = createRequest("http://localhost:3000/api/restaurants");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.restaurants).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.restaurants.length).toBeGreaterThan(0);
    });

    it("應該能夠搜尋餐廳", async () => {
      const request = createRequest(
        "http://localhost:3000/api/restaurants?search=東京"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.restaurants.some((r: { name: string }) => r.name.includes("東京"))
      ).toBe(true);
    });

    it("應該能夠依都道府縣篩選", async () => {
      const request = createRequest(
        "http://localhost:3000/api/restaurants?prefecture=大阪府"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(
        data.restaurants.every(
          (r: { prefecture: string }) => r.prefecture === "大阪府"
        )
      ).toBe(true);
    });

    it("應該支援分頁", async () => {
      const request = createRequest(
        "http://localhost:3000/api/restaurants?page=1&limit=1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.restaurants.length).toBeLessThanOrEqual(1);
    });
  });

  describe("GET /api/restaurants/[id]", () => {
    let testRestaurant: { id: string; name: string };

    beforeEach(async () => {
      testRestaurant = await prisma.restaurant.create({
        data: {
          name: "TEST_詳細資料餐廳",
          prefecture: "東京都",
          city: "渋谷区",
          postalCode: "1500002",
          address: "東京都渋谷区渋谷1-1-1",
        },
      });
    });

    it("應該能夠取得特定餐廳詳細資料", async () => {
      const response = await getById(
        createRequest(
          `http://localhost:3000/api/restaurants/${testRestaurant.id}`
        ),
        { params: { id: testRestaurant.id } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testRestaurant.id);
      expect(data.name).toBe(testRestaurant.name);
      expect(data.reviews).toBeDefined();
    });

    it("應該處理不存在的餐廳ID", async () => {
      const response = await getById(
        createRequest("http://localhost:3000/api/restaurants/nonexistent"),
        { params: { id: "nonexistent" } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("找不到指定的餐廳");
    });
  });

  describe("PUT /api/restaurants/[id]", () => {
    let testRestaurant: { id: string; name: string };

    beforeEach(async () => {
      testRestaurant = await prisma.restaurant.create({
        data: {
          name: "TEST_更新前餐廳",
          prefecture: "東京都",
          city: "渋谷区",
          postalCode: "1500002",
          address: "東京都渋谷区渋谷1-1-1",
        },
      });
    });

    it("應該能夠更新餐廳資訊", async () => {
      const updateData = {
        name: "TEST_更新後餐廳",
        city: "新宿区",
      };

      const request = createRequest(
        `http://localhost:3000/api/restaurants/${testRestaurant.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: { id: testRestaurant.id },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe(updateData.name);
      expect(data.city).toBe(updateData.city);
    });
  });

  describe("DELETE /api/restaurants/[id]", () => {
    let testRestaurant: { id: string; name: string };

    beforeEach(async () => {
      testRestaurant = await prisma.restaurant.create({
        data: {
          name: "TEST_待刪除餐廳",
          prefecture: "東京都",
          city: "渋谷区",
          postalCode: "1500002",
          address: "東京都渋谷区渋谷1-1-1",
        },
      });
    });

    it("應該能夠刪除沒有評價的餐廳", async () => {
      const response = await DELETE(
        createRequest(
          `http://localhost:3000/api/restaurants/${testRestaurant.id}`
        ),
        { params: { id: testRestaurant.id } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("餐廳已成功刪除");

      // 驗證餐廳已被刪除
      const deletedRestaurant = await prisma.restaurant.findUnique({
        where: { id: testRestaurant.id },
      });
      expect(deletedRestaurant).toBeNull();
    });

    it("應該防止刪除有評價的餐廳", async () => {
      // 建立評價
      await prisma.review.create({
        data: {
          restaurantId: testRestaurant.id,
          visitDate: new Date(),
          visitTime: "12:00",
          partySize: 2,
          reservationStatus: "無需排隊",
          orderMethod: "食券機",
          paymentMethod: "現金",
          textReview: "測試評價內容",
        },
      });

      const response = await DELETE(
        createRequest(
          `http://localhost:3000/api/restaurants/${testRestaurant.id}`
        ),
        { params: { id: testRestaurant.id } }
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("無法刪除有評價記錄的餐廳");
    });
  });
});
