import fs from "fs";

async function main() {
  const response = await fetch("https://www.poitan.jp/feed", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "Accept":
        "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      "Accept-Language":
        "ja,en-US;q=0.9,en;q=0.8",
      "Referer":
        "https://www.poitan.jp/"
    }
  });

  if (!response.ok) {
    throw new Error(
      `RSS取得失敗: ${response.status} ${response.statusText}`
    );
  }

  const rss = await response.text();

  fs.writeFileSync("feed-site9.xml", rss);

  console.log("site9 完了: RSS保存");
}

main().catch(err => {
  console.error("スクレイピングエラー (site9):", err);
  process.exit(1);
});
