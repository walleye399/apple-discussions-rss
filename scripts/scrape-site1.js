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

  // SPA の内部遷移待ち（ここが超重要）
  await new Promise(resolve => setTimeout(resolve, 20000));

  // スレッドURLを抽出
  const items = await page.evaluate(() => {
    const anchors = document.querySelectorAll("a[href*='/thread/']");
    return Array.from(anchors).map(a => ({
      title: a.innerText.trim(),
      link: a.href,
      date: new Date().toUTCString() // RSS 用に pubDate 相当を入れておく
    }));
  });

  await browser.close();

  // ここだけ今の構成に合わせて site1.json に
  fs.writeFileSync("site1.json", JSON.stringify(items, null, 2));
  console.log(`取得件数 (site1): ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site1):", err);
  process.exit(1);
});
