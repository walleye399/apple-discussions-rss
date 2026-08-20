import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function scrape() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Apple Discussions Japan 最新投稿ページ
    await page.goto("https://discussionsjapan.apple.com/browse?&sortBy=dateCreatedNewest", {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });

    // SPA の内部レンダリング待ち
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 正しいセレクタ（2026年現在）
    const exists = await page.$('a[data-test="thread-link"]');
    if (!exists) {
      console.error("site1: thread-link が見つからないためスキップします");
      await browser.close().catch(() => {});
      return false;
    }

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[data-test="thread-link"]')).map(a => ({
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
    return true;

  } catch (err) {
    console.error("site1 失敗（スキップします）:", err);

    if (browser) {
      try { await browser.close(); } catch {}
    }

    return false;
  }
}

async function main() {
  const ok = await scrape();
  if (!ok) {
    console.log("site1 をスキップしました");
  }
}

main();
