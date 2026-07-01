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

  // GitHub Actions の低速環境対策
  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("section ul li div h2 a")).map(a => ({
      title: a.innerText.trim(),
      link: a.href,
      date: new Date().toUTCString()
    }));
  });

  await browser.close();

  fs.writeFileSync("site2.json", JSON.stringify(items, null, 2));
  console.log(`取得件数 (site2): ${items.length}`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site2):", err);
  process.exit(1);
});
