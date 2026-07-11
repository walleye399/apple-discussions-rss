import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function scrape() {
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

    await new Promise(resolve => setTimeout(resolve, 20000));

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ul li div h3 a")).map(a => ({
        title: a.innerText.trim(),
        link: a.href,
        date: new Date().toUTCString()
      }));
    });

    await browser.close();

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

    console.log(`site5 完了: ${items.length}件`);
    return true;

  } catch (err) {
    console.error("site5 失敗（スキップします）:", err);
    return false;  // ★ exit 1 を使わない
  }
}

async function main() {
  const ok = await scrape();
  if (!ok) {
    console.log("site5 をスキップしました");
  }
}

main();
