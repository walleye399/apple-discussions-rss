import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  await page.goto("https://kuruma-news.jp/archive", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // 記事リストを抽出（HTML構造に完全一致）
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("li.p-archive__list-item")).map(el => {
      const a = el.querySelector("a.p-archive__list-item__link");
      const title = el.querySelector("h3.p-archive__list-item__title")?.innerText.trim() || "";
      const link = a?.href || "";
      const date = el.querySelector("time.p-archive__list-item__date")?.innerText.trim() || "";

      return { title, link, date };
    });
  });

  await browser.close();

  fs.writeFileSync("site2.json", JSON.stringify(items, null, 2));
  console.log(`取得件数 (site2): ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site2):", err);
  process.exit(1);
});
