import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("開始資料庫種子資料建立...");

  // 建立一些基本標籤
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "美味" },
      update: {},
      create: { name: "美味" },
    }),
    prisma.tag.upsert({
      where: { name: "CP值高" },
      update: {},
      create: { name: "CP值高" },
    }),
    prisma.tag.upsert({
      where: { name: "排隊店" },
      update: {},
      create: { name: "排隊店" },
    }),
    prisma.tag.upsert({
      where: { name: "老店" },
      update: {},
      create: { name: "老店" },
    }),
    prisma.tag.upsert({
      where: { name: "新店" },
      update: {},
      create: { name: "新店" },
    }),
  ]);

  console.log(`建立了 ${tags.length} 個標籤`);
  console.log("資料庫種子資料建立完成！");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
