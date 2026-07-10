import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

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

  await new Promise(resolve => setTimeout(resolve, 20000));

  const items = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    Array.from(document.querySelectorAll("section div ul li a div")).forEach(div => {
      const titleEl = div.querySelector("span.comment");
      const linkEl = div.closest("a");

      const title = titleEl?.innerText.trim() || "";
      const link = linkEl?.href || "";

      if (!title || seen.has(link)) return;

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
    .ele("title").txt("ライブドアブログ ヘッドライン").up()
    .ele("link").txt("https://blog.livedoor.com/headline/").up()
    .ele("description").txt("ライブドアブログ ヘッドライン 最新記事").up();

  items.forEach(item => {
    feed.ele("item")
      .ele("title").txt(item.title).up()
      .ele("link").txt(item.link).up()
      .ele("guid").txt(item.link).up()
      .ele("pubDate").txt(item.date).up()
      .up();
  });

  const xml = feed.end({ prettyPrint: true });
  fs.writeFileSync("feed-site3.xml", xml);

  console.log(`site3 完了: ${items.length}件`);
}

main().catch(err => {
  console.error("site3 エラー:", err);
  process.exit(1);
});
