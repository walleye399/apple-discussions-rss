import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://blog.livedoor.com/headline/", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // GitHub Actions の低速環境対策
  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    const seenLinks = new Set();
    const results = [];

    Array.from(document.querySelectorAll("section div ul li a div")).forEach(div => {
      const titleEl = div.querySelector("span.comment");
      const linkEl = div.closest("a");
      const title = titleEl?.innerText.trim() || "";
      const link = linkEl?.href || "";

      // タイトルが空 or リンク重複ならスキップ
      if (!title || seenLinks.has(link)) return;

      seenLinks.add(link);
      results.push({
        title,
        link,
        date: new Date().toUTCString()
      });
    });

    return results;
  });

  await browser.close();

  fs.writeFileSync("site3.json", JSON.stringify(items, null, 2));
  console.log(`取得件数 (site3): ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site3):", err);
  process.exit(1);
});
