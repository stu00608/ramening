import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 日本都道府縣正規表達式常數
export const JAPAN_PREFECTURE_REGEX = /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/;

// 日本地址解析函數
export function parseJapaneseAddress(address: string) {
  // 移除 "日本、" 前綴
  const cleanAddress = address.replace(/^日本、/, "").replace(/^Japan,\s*/, "");

  // 解析都道府縣
  const prefectureMatch = cleanAddress.match(JAPAN_PREFECTURE_REGEX);
  const prefecture = prefectureMatch ? prefectureMatch[1] : "";

  // 解析郵遞區號
  const postalCodeRegex = /〒(\d{7}|\d{3}-\d{4})/;
  const postalCodeMatch = cleanAddress.match(postalCodeRegex);
  let postalCode = "";
  if (postalCodeMatch) {
    postalCode = postalCodeMatch[1].replace("-", "");
  }

  // 解析市區町村
  let city = "";
  if (prefecture) {
    const addressAfterPrefecture = cleanAddress.split(prefecture)[1];
    if (addressAfterPrefecture) {
      const cityRegex = /^([^0-9]*?[市区町村])/;
      const cityMatch = addressAfterPrefecture.match(cityRegex);
      if (cityMatch) {
        city = cityMatch[1];
      }
    }
  }

  // 標準化地址格式 - 移除郵遞區號
  const standardizedAddress = cleanAddress
    .replace(/〒\d{7}/, "")
    .replace(/〒\d{3}-\d{4}/, "")
    .trim();

  return {
    prefecture,
    city,
    postalCode,
    standardizedAddress,
    originalAddress: address,
  };
}
