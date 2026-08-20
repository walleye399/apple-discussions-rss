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

    // Apple Discussions は自動リロードが多いので waitUntil を弱める
    await page.goto("https://discussions.apple.com/community", {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });

    // GitHub Actions の低速環境対策（site1 は特に不安定）
    await new Promise(resolve => setTimeout(resolve, 8000));

    // evaluate 中にリロードされるのを防ぐため、DOM が安定するまで待つ
    await page.waitForSelector("a.title", { timeout: 15000 }).catch(() => {});

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
    return true;

  } catch (err) {
    console.error("site1 失敗（スキップします）:", err);

    // ★ evaluate 中にリロードされても必ずブラウザを閉じる
    if (browser) {
      try { await browser.close(); } catch {}
    }

    return false; // exit 1 を使わない → スキップ扱い
  }
}

async function main() {
  const ok = await scrape();
  if (!ok) {
    console.log("site1 をスキップしました");
  }
}

main();
