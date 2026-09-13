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

  // WordPress + 広告 + 画像読み込みのため長めに待つ
  await new Promise(resolve => setTimeout(resolve, 8000));

  const items = await page.evaluate(() => {
    const selector = "dl.clearfix h3 a";
    const els = document.querySelectorAll(selector);

    // デバッグ用：何件見つかったかログに出す
    console.log("site9 セレクタ一致件数:", els.length);

    return Array.from(els).map(a => ({
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
