import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

const MAX_RETRY = 3;

async function scrapeOnce(attempt) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();

    await page.goto("https://press.portal-th.com/list", {
      waitUntil: "domcontentloaded",
      timeout: 90000
    });

    // GitHub Actions の低速環境対策（他サイトと同じ）
    await new Promise(resolve => setTimeout(resolve, 20000));

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ul li div h3 a")).map(a => ({
        title: a.innerText.trim(),
        link: a.href,
        date: new Date().toUTCString()
      }));
    });

    const feed = create({ version: "1.0" })
      .ele("rss", { version: "2.0" })
      .ele("channel")
        .ele("title").txt("Portal Thailand Press").up()
        .ele("link").txt("https://press.portal-th.com/list").up()
        .ele("description").txt("Portal Thailand Press 最新記事").up();

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

    console.log(`site5 完了: ${items.length}件 (試行 ${attempt} 回目)`);

    await browser.close();
    return true;

  } catch (err) {
    console.error(`スクレイピングエラー (site5, 試行 ${attempt} 回目):`, err);
    await browser.close();
    return false;
  }
}

async function main() {
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const ok = await scrapeOnce(attempt);
    if (ok) return;
    console.log(`site5 リトライ準備中… (${attempt}/${MAX_RETRY})`);
  }

  console.error(`site5 が ${MAX_RETRY} 回試行しても失敗しました`);
  process.exit(1);
}

main().catch(err => {
  console.error("site5 予期せぬエラー:", err);
  process.exit(1);
});
