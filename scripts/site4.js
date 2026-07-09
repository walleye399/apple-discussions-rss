import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();

    await page.goto("https://digitalpr.jp", {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    // GitHub Actions の低速環境対策
    await new Promise(resolve => setTimeout(resolve, 20000));

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("article h2 a")).map(a => ({
        title: a.innerText.trim(),
        link: a.href,
        date: new Date().toUTCString()
      }));
    });

    const feed = create({ version: "1.0" })
      .ele("rss", { version: "2.0" })
      .ele("channel")
      .ele("title").txt("Digital PR Japan").up()
      .ele("link").txt("https://digitalpr.jp").up()
      .ele("description").txt("Digital PR Japan 最新記事").up();

    items.forEach(item => {
      feed.ele("item")
        .ele("title").txt(item.title).up()
        .ele("link").txt(item.link).up()
        .ele("guid").txt(item.link).up()
        .ele("pubDate").txt(item.date).up()
        .up();
    });

    const xml = feed.end({ prettyPrint: true });
    fs.writeFileSync("feed-site4.xml", xml);

    console.log(`site4 完了: ${items.length}件`);

  } catch (err) {
    console.error("スクレイピングエラー (site4):", err);
    throw err; // ← process.exit(1) を使わない
  } finally {
    await browser.close(); // ← 成功時も失敗時も必ず Chrome を閉じる
  }
}

main();
