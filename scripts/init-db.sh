#!/bin/bash

# 初始化 Ramening 專案腳本
echo "🔧 初始化 Ramening 專案..."

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 錯誤：Docker 未運行，請先啟動 Docker"
    exit 1
fi

# 檢查 .env 檔案
if [ ! -f .env ]; then
    echo "📝 建立 .env 檔案..."
    cp .env.example .env
    echo "⚠️  請編輯 .env 檔案並填入 GOOGLE_PLACES_API_KEY"
fi

# 先停止現有的容器
echo "🛑 停止現有容器..."
docker-compose down > /dev/null 2>&1

# 建立 Docker 映像
echo "🏗️ 建立 Docker 映像..."
docker-compose build --no-cache

# 啟動所有服務
echo "🚀 啟動所有服務..."
docker-compose up -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 15

# 檢查服務狀態
echo "📊 檢查服務狀態..."
docker-compose ps

# 建立基本標籤資料
echo "🏷️ 建立基本標籤資料..."
sleep 5
docker-compose exec -T postgres psql -U postgres -d ramening_dev -c "
INSERT INTO tags (id, name) VALUES 
  (gen_random_uuid()::text, '美味'),
  (gen_random_uuid()::text, 'CP值高'), 
  (gen_random_uuid()::text, '排隊店'),
  (gen_random_uuid()::text, '老店'),
  (gen_random_uuid()::text, '新店'),
  (gen_random_uuid()::text, '限量'),
  (gen_random_uuid()::text, '推薦'),
  (gen_random_uuid()::text, '濃厚'),
  (gen_random_uuid()::text, '清爽'),
  (gen_random_uuid()::text, '辣味')
ON CONFLICT (name) DO NOTHING;
" > /dev/null 2>&1

echo ""
echo "✅ Ramening 專案初始化完成！"
echo "📱 應用程式正在 http://localhost:3000 運行"
echo "🗄️ 資料庫可透過 http://localhost:5432 存取"
echo ""
echo "常用指令："
echo "  npm run docker:logs     # 查看所有服務日誌"
echo "  npm run docker:logs:web # 查看 Next.js 日誌"
echo "  npm run docker:logs:db  # 查看資料庫日誌"
echo "  npm run docker:down     # 停止所有服務"
echo "  npm run docker:restart  # 重啟 Next.js 服務"