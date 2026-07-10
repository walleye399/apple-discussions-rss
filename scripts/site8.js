import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://j-defense.ikaros.jp", {
    waitUntil: "networkidle2",
    timeout: 120000
  });

  // ページ描画待機（軽量）
  await new Promise(resolve => setTimeout(resolve, 5000));

  const items = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    // politepol の XPath に対応する CSS セレクタ
    document.querySelectorAll("main article section div ul li div div p a").forEach(a => {
      const title = a?.innerText.trim();
      const link = a?.href;

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
      .ele("title").txt("J-DEFENSE 新着記事").up()
      .ele("link").txt("https://j-defense.ikaros.jp").up()
      .ele("description").txt("J-DEFENSE 最新記事一覧").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site8.xml", xml);

  console.log(`site8 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site8):", err);
  process.exit(1);
});
