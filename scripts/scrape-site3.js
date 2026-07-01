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

  // Apple と同じ「確実に DOM が揃うまで待つ」方式
  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div.headline")).map(el => {
      const a = el.querySelector("h3.headline-title a");
      return {
        title: a?.innerText.trim() || "",
        link: a?.href || "",
        date: el.querySelector("div.headline-date")?.innerText.trim() || ""
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
