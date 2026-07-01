import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://kuruma-news.jp/archive", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // Apple と同じ「確実に DOM が揃うまで待つ」方式
  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("li.p-archive__list-item")).map(el => {
      const a = el.querySelector("a.p-archive__list-item__link");
      return {
        title: el.querySelector("h3.p-archive__list-item__title")?.innerText.trim() || "",
        link: a?.href || "",
        date: el.querySelector("time.p-archive__list-item__date")?.innerText.trim() || ""
      };
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
