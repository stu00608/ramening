import { test, expect } from '@playwright/test';

test.describe('評價編輯頁面', () => {
  test.beforeEach(async ({ page }) => {
    // 確保有評價資料可以編輯
    await page.goto('/reviews');
    
    // 等待頁面載入
    await page.waitForSelector('h1:has-text("評價管理")', { timeout: 10000 });
    
    // 檢查是否有評價存在
    const reviewCards = await page.locator('a[href*="/reviews/"][href*="/edit"]').count();
    
    if (reviewCards === 0) {
      // 如果沒有評價，先創建一個
      await page.goto('/search');
      await page.fill('input[placeholder*="搜尋"]', '拉麵店');
      await page.keyboard.press('Enter');
      
      // 等待搜尋結果
      await page.waitForSelector('[data-testid="restaurant-card"]', { timeout: 10000 });
      
      // 選擇第一個餐廳
      await page.click('[data-testid="restaurant-card"]:first-child button');
      
      // 創建簡單的評價
      await page.fill('input[type="time"]', '12:00');
      await page.fill('input[placeholder*="醬油拉麵"]', '醬油拉麵');
      await page.fill('input[placeholder*="800"]', '800');
      await page.fill('textarea[placeholder*="分享您的用餐體驗"]', '測試評價內容');
      
      // 儲存評價
      await page.click('button:has-text("儲存評價")');
      
      // 等待成功訊息
      await page.waitForSelector('.toast', { timeout: 10000 });
      
      // 回到評價列表
      await page.goto('/reviews');
      await page.waitForSelector('h1:has-text("評價管理")', { timeout: 10000 });
    }
  });

  test('應該能夠載入編輯頁面', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 檢查頁面元素
    await expect(page.locator('h1')).toContainText('編輯評價');
    
    // 檢查表單元素存在
    await expect(page.locator('input[type="time"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button:has-text("更新評價")')).toBeVisible();
  });

  test('應該預填現有的表單資料', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 檢查時間欄位有預填值
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).not.toHaveValue('');
    
    // 檢查文字評價有預填值
    const textArea = page.locator('textarea');
    await expect(textArea).not.toHaveValue('');
  });

  test('應該顯示餐廳資訊', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 檢查餐廳資訊卡片
    await expect(page.locator('h5:has-text("餐廳資訊")')).toBeVisible();
    
    // 檢查標題下方不應該有重複的餐廳資訊
    const titleSection = page.locator('h1:has-text("編輯評價")').locator('..');
    await expect(titleSection.locator('p')).toHaveCount(0);
  });

  test('應該能夠修改並儲存評價', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 修改文字評價
    const textArea = page.locator('textarea');
    await textArea.fill('修改後的評價內容 - ' + Date.now());
    
    // 儲存修改
    await page.click('button:has-text("更新評價")');
    
    // 等待成功訊息
    await page.waitForSelector('.toast', { timeout: 10000 });
    
    // 檢查是否返回評價列表
    await expect(page).toHaveURL('/reviews');
  });

  test('最寄駅選擇功能應該正常運作', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 檢查最寄駅區塊
    await expect(page.locator('h5:has-text("最寄駅")')).toBeVisible();
    
    // 等待車站資料載入（如果有的話）
    await page.waitForTimeout(3000);
    
    // 檢查是否有車站選擇器或無車站訊息
    const hasStationSelect = await page.locator('select').count() > 0;
    const hasNoStationMessage = await page.locator('text=附近沒有找到火車站').count() > 0;
    
    expect(hasStationSelect || hasNoStationMessage).toBeTruthy();
  });

  test('取消編輯應該返回評價列表', async ({ page }) => {
    // 點擊第一個評價的編輯按鈕
    await page.click('a[href*="/reviews/"][href*="/edit"]:first-child');
    
    // 等待編輯頁面載入
    await page.waitForSelector('h1:has-text("編輯評價")', { timeout: 10000 });
    
    // 點擊取消編輯
    await page.click('button:has-text("取消編輯")');
    
    // 檢查是否返回評價列表
    await expect(page).toHaveURL('/reviews');
  });
});