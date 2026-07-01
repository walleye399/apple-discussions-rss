import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  await page.goto("https://blog.livedoor.com/headline/", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // 記事抽出（HTML構造に完全一致）
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div.headline")).map(el => {
      const a = el.querySelector("h3.headline-title a");
      const title = a?.innerText.trim() || "";
      const link = a?.href || "";
      const date = el.querySelector("div.headline-date")?.innerText.trim() || "";

      return { title, link, date };
    });
  });

  await browser.close();

  fs.writeFileSync("site3.json", JSON.stringify(items, null, 2));
  console.log(`取得件数 (site3): ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site3):", err);
  process.exit(1);
});
