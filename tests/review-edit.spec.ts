import { expect, test } from "@playwright/test";

test.describe("評價編輯頁面", () => {
  test("應該能夠載入評價列表頁面", async ({ page }) => {
    await page.goto("/reviews");

    // 檢查頁面標題
    await expect(page).toHaveTitle(/Ramening/);
    await expect(page.getByRole("heading", { name: "評價管理" })).toBeVisible();
  });

  test("評價列表應該顯示基本資訊", async ({ page }) => {
    await page.goto("/reviews");

    // 等待頁面載入
    await page.waitForSelector('h1:has-text("評價管理")');

    // 檢查基本元素存在
    await expect(page.locator("text=評價列表")).toBeVisible();
    await expect(page.locator("text=建立新評價")).toBeVisible();
  });
});
