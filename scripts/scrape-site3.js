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
    return Array.from(document.querySelectorAll("section div ul li a div")).map(div => {
      const titleEl = div.querySelector("span.comment");
      const linkEl = div.closest("a");
      const title =
        titleEl?.innerText.trim() ||
        div.innerText.trim() || // フォールバック
        "(タイトルなし)";
      return {
        title,
        link: linkEl?.href || "",
        date: new Date().toUTCString()
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
