import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Cloudflare対策：軽量ページを使う
  await page.goto("https://pr-free.jp/list/", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // SPAではないので待機は短くてOK
  await new Promise(resolve => setTimeout(resolve, 5000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("article h2 a")).map(a => ({
      title: a.innerText.trim(),
      link: a.href,
      date: new Date().toUTCString()
    }));
  });

  await browser.close();

  const feed = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel")
    .ele("title").txt("PR-FREE").up()
    .ele("link").txt("https://pr-free.jp").up()
    .ele("description").txt("PR-FREE 最新記事").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site5.xml", xml);

  console.log(`site5 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("site5 エラー:", err);
  process.exit(1);
});
