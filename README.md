# Ramening 🍜

一個完全在本地端運行的日本拉麵評價紀錄工具，幫助您記錄和管理拉麵店造訪經驗。

## 專案概述

- **拉麵店搜尋**：整合 Google Places API（限日本地區）
- **詳細評價記錄**：包含造訪資訊、拉麵品項、照片和評分
- **評價管理**：直觀的儀表板查看和編輯評價
- **Instagram 匯出**：自動產生適合社群分享的內容格式

## 技術堆疊

- **框架**：Next.js 15 + React 19
- **資料庫**：PostgreSQL + Prisma ORM
- **UI 元件**：shadcn/ui + Tailwind CSS
- **開發工具**：TypeScript, Biome, Vitest, Playwright
- **容器化**：Docker + Docker Compose

## Getting Started

### 環境需求

- Node.js 18+ 
- Docker 和 Docker Compose
- Git

### 快速啟動

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd ramening
   ```

2. **設定環境變數**
   ```bash
   cp .env.example .env
   ```
   
   編輯 `.env` 檔案並填入必要資訊：
   ```env
   # 資料庫設定（使用預設值即可開始開發）
   DATABASE_URL="postgresql://ramening:ramening_dev_password@localhost:5432/ramening_dev"
   
   # 必須填入的變數
   GOOGLE_PLACES_API_KEY="your-google-places-api-key-here"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

3. **安裝依賴**
   ```bash
   npm install
   ```

4. **啟動開發環境**
   
   **選項 A：完整 Docker 環境（推薦）**
   ```bash
   # 一鍵啟動完整開發環境
   npm run setup
   ```
   
   **選項 B：手動 Docker 啟動**
   ```bash
   # 建立並啟動所有服務（PostgreSQL + Next.js）
   npm run docker:up
   
   # 初始化資料庫（首次啟動需要）
   docker-compose exec -T web npx prisma db push --accept-data-loss
   ```
   
   **選項 C：僅資料庫使用 Docker**
   ```bash
   # 僅啟動 PostgreSQL
   npm run docker:db
   
   # 本地啟動 Next.js
   npm run dev
   ```

5. **開啟瀏覽器**
   
   訪問 [http://localhost:3000](http://localhost:3000) 開始使用

### 開發流程

#### 日常開發指令

```bash
# 啟動開發伺服器
npm run dev

# 程式碼檢查和格式化
npm run lint        # 檢查程式碼問題
npm run lint:fix    # 自動修復問題
npm run format      # 格式化程式碼

# 測試
npm run test        # 執行單元測試
npm run test:ui     # 開啟測試 UI
npm run test:e2e    # 執行 E2E 測試

# 資料庫操作
npm run db:migrate  # 執行資料庫遷移
npm run db:generate # 重新產生 Prisma 客戶端
npm run db:seed     # 建立種子資料
npm run db:studio   # 開啟 Prisma Studio
```

#### Docker 指令

```bash
# 啟動所有服務（PostgreSQL + Next.js）
npm run docker:up

# 僅啟動 PostgreSQL
npm run docker:db

# 停止所有服務
npm run docker:down

# 重建並啟動
npm run docker:build && npm run docker:up

# 查看日誌
npm run docker:logs       # 所有服務
npm run docker:logs:web   # Next.js 日誌
npm run docker:logs:db    # PostgreSQL 日誌

# 重啟 Next.js 服務
npm run docker:restart
```

#### 開發工作流程

1. **建立新功能**
   ```bash
   # 建立新分支
   git checkout -b feature/新功能名稱
   
   # 開發功能...
   npm run dev
   ```

2. **程式碼品質檢查**
   ```bash
   # 執行所有檢查
   npm run lint
   npm run test
   npm run test:e2e
   ```

3. **提交變更**
   ```bash
   # 格式化程式碼
   npm run format
   
   # 提交
   git add .
   git commit -m "新增: 功能描述"
   ```

### 專案結構

```
src/
├── app/                 # Next.js App Router 頁面
├── components/          # 共用 UI 元件
├── features/           # 功能模組（package by feature）
├── lib/                # 工具函式和設定
├── types/              # TypeScript 類型定義
└── test/               # 測試設定

prisma/
├── schema.prisma       # 資料庫模型定義
└── seed.ts            # 種子資料

tests/                  # E2E 測試檔案
examples/              # 元件範例（不直接使用）
```

### 常見問題

#### Q: Docker 啟動失敗？
```bash
# 清理 Docker 資源
docker-compose down -v
docker system prune -f
npm run docker:up
```

#### Q: 資料庫連線問題？
```bash
# 重啟 PostgreSQL 容器
docker-compose restart postgres
# 檢查資料庫狀態
docker-compose logs postgres
```

#### Q: 依賴安裝問題？
```bash
# 清理 node_modules 和重新安裝
rm -rf node_modules package-lock.json
npm install
```

#### Q: Prisma 客戶端錯誤？
```bash
# 重新產生 Prisma 客戶端
npm run db:generate
```
