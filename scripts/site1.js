import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://discussions.apple.com/community", {
    waitUntil: "networkidle2",
    timeout: 120000
  });

  // ページ描画待機（軽量）
  await new Promise(resolve => setTimeout(resolve, 5000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a.title")).map(a => ({
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
      .ele("title").txt("Apple Discussions").up()
      .ele("link").txt("https://discussions.apple.com/community").up()
      .ele("description").txt("Apple Discussions 最新記事").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site1.xml", xml);

  console.log(`site1 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site1):", err);
  process.exit(1);
});
