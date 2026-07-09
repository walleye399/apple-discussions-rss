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

    await page.goto("https://discussionsjapan.apple.com/browse?&sortBy=dateCreatedNewest", {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    await new Promise(resolve => setTimeout(resolve, 20000));

    const items = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a[href*='/thread/']");
      return Array.from(anchors).map(a => ({
        title: a.innerText.trim(),
        link: a.href,
        date: new Date().toUTCString()
      }));
    });

    // RSS生成
    const feed = create({ version: "1.0" })
      .ele("rss", { version: "2.0" })
      .ele("channel")
      .ele("title").txt("Apple Discussions Japan").up()
      .ele("link").txt("https://discussionsjapan.apple.com").up()
      .ele("description").txt("Apple Discussions Japan 最新投稿").up();

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

  } catch (err) {
    console.error("site1 エラー:", err);
    throw err; // ← process.exit(1) を使わない
  } finally {
    await browser.close(); // ← 成功時も失敗時も必ず Chrome を閉じる
  }
}

main();
