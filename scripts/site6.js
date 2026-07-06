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

  // GitHub Actions の低速環境対策
  await new Promise(resolve => setTimeout(resolve, 20000));

  // 記事タイトルとリンクを抽出
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div div div div div div div a")).map(a => ({
      title: a.innerText.trim(),
      link: a.href,
      date: new Date().toUTCString()
    }));
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
