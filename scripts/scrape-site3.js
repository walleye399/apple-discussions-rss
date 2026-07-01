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
    return Array.from(document.querySelectorAll("div.headline h3.headline-title a")).map(a => {
      const dateEl = a.closest("div.headline")?.querySelector("div.headline-date");
      return {
        title: a.innerText.trim(),
        link: a.href,
        date: dateEl?.innerText.trim() || new Date().toUTCString()
      };
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
