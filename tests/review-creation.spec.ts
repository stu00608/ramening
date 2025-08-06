import { expect, test } from "@playwright/test";

test("評價建立頁面應該能正確載入", async ({ page }) => {
  // 直接導航到評價建立頁面（使用餐廳 ID）
  await page.goto("/reviews/new?restaurantId=cmdvolz2z0004qj0ttgrxljml");

  // 檢查頁面標題
  await expect(page).toHaveTitle(/Ramening/);
  await expect(
    page.getByRole("heading", { name: "建立拉麵評價" })
  ).toBeVisible();

  // 檢查基本表單元素存在
  await expect(page.getByText("用餐人數").first()).toBeVisible();
  await expect(page.getByText("預約狀態").first()).toBeVisible();
  await expect(page.getByText("點餐方式").first()).toBeVisible();
  await expect(page.getByText("文字評價").first()).toBeVisible();
  await expect(page.locator('button:has-text("儲存評價")')).toBeVisible();
});
