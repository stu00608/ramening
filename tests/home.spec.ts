import { expect, test } from "@playwright/test";

test("首頁應該正確顯示", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Ramening/);
  await expect(page.getByRole("heading", { name: "Ramening" })).toBeVisible();
  await expect(page.getByText("日本拉麵評價紀錄工具")).toBeVisible();
});
