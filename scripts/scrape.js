import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // 新しい投稿順に並べ替えたURL
  await page.goto("https://discussionsjapan.apple.com/browse?&sortBy=dateCreatedNewest", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // SPA の内部遷移待ち
  await new Promise(resolve => setTimeout(resolve, 20000));

  // スレッドURLを抽出
  const items = await page.evaluate(() => {
    const anchors = document.querySelectorAll("a[href*='/thread/']");
    return Array.from(anchors).map(a => ({
      title: a.innerText.trim(),
      url: a.href,
      timestamp: Date.now()
    }));
  });

  await browser.close();

  fs.writeFileSync("feed.json", JSON.stringify(items, null, 2));
  console.log(`取得件数: ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー:", err);
  process.exit(1);
});
