import { expect, test } from "@playwright/test";

test("建立評價應該能成功儲存包含車站資訊", async ({ page }) => {
  // 先導航到搜尋頁面並選擇一個餐廳
  await page.goto("/search");
  
  // 搜尋拉麵店
  await page.fill('input[placeholder="輸入店名、地區或關鍵字..."]', "恵比寿 ラーメン");
  await page.click('button:has-text("搜尋")');
  
  // 等待搜尋結果並選擇第一間店
  await page.waitForSelector('button:has-text("選擇此店舖")');
  await page.click('button:has-text("選擇此店舖")');
  
  // 等待導航到評價建立頁面
  await page.waitForURL(/\/reviews\/new/);
  
  // 填寫基本評價資料
  await page.fill('input[name="visitTime"]', "12:30");
  await page.selectOption('select:has-text("用餐人數")', "2");
  await page.selectOption('select:has-text("預約狀態")', "事前預約");
  await page.selectOption('select:has-text("點餐方式")', "食券機");
  
  // 選擇付款方式
  await page.click('[data-testid="payment-methods"] button');
  await page.click('div[data-value="現金"]');
  await page.keyboard.press('Escape'); // 關閉下拉選單
  
  // 新增拉麵品項
  await page.fill('input[placeholder="拉麵名稱"]', "醬油拉麵");
  await page.fill('input[placeholder="價格"]', "800");
  await page.selectOption('select[name="ramenItems.0.category"]', "SHOYU");
  
  // 填寫文字評價
  await page.fill('textarea[placeholder="分享您的用餐體驗..."]', "這是一個測試評價，確認車站資訊是否能正確儲存。");
  
  // 等待車站資訊載入完成
  await page.waitForSelector('select:has-text("最寄駅")');
  
  // 選擇最寄駅
  await page.selectOption('select:has-text("最寄駅")', { index: 1 }); // 選擇第一個有效選項
  
  // 監聽 API 請求
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/reviews') && response.request().method() === 'POST'
  );
  
  // 提交表單
  await page.click('button:has-text("儲存評價")');
  
  // 等待 API 回應
  const response = await responsePromise;
  const responseBody = await response.json();
  
  // 檢查 API 回應
  console.log("API 回應:", JSON.stringify(responseBody, null, 2));
  console.log("HTTP 狀態碼:", response.status());
  
  if (response.status() !== 201) {
    console.error("API 錯誤:", responseBody);
  }
  
  // 斷言：評價應該建立成功
  expect(response.status()).toBe(201);
  expect(responseBody.success).toBe(true);
  expect(responseBody.review).toBeDefined();
  expect(responseBody.review.nearestStation).toBeDefined();
  expect(responseBody.review.walkingTime).toBeDefined();
  expect(responseBody.review.stationPlaceId).toBeDefined();
});