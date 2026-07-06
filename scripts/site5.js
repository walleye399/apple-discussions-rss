import puppeteer from "puppeteer";
import fs from "fs";
import { create } from "xmlbuilder2";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://pr-free.jp", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // GitHub Actions の低速環境対策（他サイトと同じ）
  await new Promise(resolve => setTimeout(resolve, 20000));

  // 記事タイトルとリンクを抽出
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("aside ul ul li a p")).map(p => {
      const a = p.closest("a");
      return {
        title: p.innerText.trim(),
        link: a?.href || "",
        date: new Date().toUTCString()
      };
    });
  });

  await browser.close();

  // RSS生成
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
  console.error("スクレイピングエラー (site5):", err);
  process.exit(1);
});
