import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.poitan.jp", {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  // 記事一覧のDOMが出るまで確実に待つ
  await page.waitForSelector("dl.clearfix h3 a", {
    timeout: 60000
  });

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("dl.clearfix h3 a")).map(a => ({
      title: a.innerText.trim(),
      link: a.href,
      date: new Date().toUTCString()
    }));
  });

  await browser.close();

  const feed = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel")
      .ele("title").txt("poitan.jp").up()
      .ele("link").txt("https://www.poitan.jp").up()
      .ele("description").txt("poitan.jp 最新記事").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site9.xml", xml);

  console.log(`site9 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("スクレイピングエラー (site9):", err);
  process.exit(1);
});
