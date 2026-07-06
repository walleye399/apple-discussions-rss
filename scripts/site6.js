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
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    Array.from(document.querySelectorAll("div div div div div div div a")).forEach(a => {
      const title = a.innerText.trim();
      const link = a.href;

      // カテゴリ見出しを除外
      const ignoreList = ["ビューティー・ヘルス", "ベビー・キッズ", "ホビー", "住宅設備"];
      if (!title || ignoreList.includes(title)) return;

      // 重複リンクを除外
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

  const feed = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel")
    .ele("title").txt("価格.com 新着情報").up()
    .ele("link").txt("https://kakaku.com/whatsnew/").up()
    .ele("description").txt("価格.com 新着情報 最新記事").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site6.xml", xml);

  console.log(`site6 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site6):", err);
  process.exit(1);
});
