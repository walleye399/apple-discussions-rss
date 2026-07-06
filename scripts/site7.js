import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://tanteifile.com", {
    waitUntil: "networkidle2",
    timeout: 120000
  });

  // ページ描画待機（軽量）
  await new Promise(resolve => setTimeout(resolve, 5000));

  const items = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    // politepol の XPath に対応する CSS セレクタ
    document.querySelectorAll("main div a article div h2").forEach(h2 => {
      const title = h2?.innerText.trim();
      const link = h2.closest("a")?.href;

      if (!title || !link) return;

      // 重複除外
      if (seen.has(link)) return;
      seen.add(link);

      results.push({
        title,
        link,
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
      .ele("title").txt("探偵ファイル 新着記事").up()
      .ele("link").txt("https://tanteifile.com").up()
      .ele("description").txt("探偵ファイル 最新記事一覧").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site7.xml", xml);

  console.log(`site7 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site7):", err);
  process.exit(1);
});
