import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://kakaku.com/whatsnew/", {
    waitUntil: "networkidle2", // JS描画完了まで待つ
    timeout: 120000
  });

  // ページが完全に描画されるまで待機（右側の記事リストが出るまで）
  await page.waitForSelector("section ul li h3 a", { timeout: 60000 });

  const items = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    document.querySelectorAll("section ul li").forEach(li => {
      const a = li.querySelector("h3 a");
      const desc = li.querySelector("p");

      const title = a?.innerText.trim();
      const link = a?.href;
      const summary = desc?.innerText.trim();

      if (!title || !link) return;
      if (seen.has(link)) return;
      seen.add(link);

      results.push({
        title,
        link,
        description: summary,
        date: new Date().toUTCString()
      });
    });

    return results;
  });

  await browser.close();

  // RSS生成
  const feed = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel")
      .ele("title").txt("価格.com 新着情報").up()
      .ele("link").txt("https://kakaku.com/whatsnew/").up()
      .ele("description").txt("価格.com 新着情報 最新記事").up();

  items.forEach(item => {
    const entry = feed.ele("item");
    entry.ele("title").txt(item.title).up();
    entry.ele("link").txt(item.link).up();
    entry.ele("guid").txt(item.link).up();
    entry.ele("description").txt(item.description || "").up();
    entry.ele("pubDate").txt(item.date).up();
    entry.up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site6.xml", xml);

  console.log(`site6 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site6):", err);
  process.exit(1);
});
