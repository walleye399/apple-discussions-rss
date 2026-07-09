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

    await page.goto("https://kakaku.com/whatsnew/", {
      waitUntil: "networkidle2",
      timeout: 120000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    let items = [];

    try {
      await page.waitForSelector("section ul li h3 a", { timeout: 5000 });

      items = await page.evaluate(() => {
        const seen = new Set();
        const results = [];

        document.querySelectorAll("section ul li").forEach(li => {
          const a = li.querySelector("h3 a");
          const desc = li.querySelector("p");

          const title = a?.innerText.trim();
          const link = a?.href;
          const summary = desc?.innerText.trim();

          if (!title || !link) return;
          if (link.endsWith("article/")) return;
          if (seen.has(link)) return;

          seen.add(link);

          results.push({
            title,
            link,
            description: summary,
            date: new Date().toUTCString()
          });
        });

        return results;
      });

    } catch {
      console.log("Fallback: using politepol selector");

      items = await page.evaluate(() => {
        const seen = new Set();
        const results = [];

        document.querySelectorAll("div div div div div div div a").forEach(a => {
          const title = a?.innerText.trim();
          const link = a?.href;

          if (!title || !link) return;
          if (link.endsWith("article/")) return;
          if (seen.has(link)) return;

          seen.add(link);

          results.push({
            title,
            link,
            date: new Date().toUTCString()
          });
        });

        return results;
      });
    }

    const feed = create({ version: "1.0" })
      .ele("rss", { version: "2.0" })
      .ele("channel")
        .ele("title").txt("価格.com 新着情報").up()
        .ele("link").txt("https://kakaku.com/whatsnew/").up()
        .ele("description").txt("価格.com 新着情報 最新記事").up();

    items.forEach(item => {
      const entry = feed.ele("item");
      entry.ele("title").txt(item.title).up();
      entry.ele("link").txt(item.link).up();
      entry.ele("guid").txt(item.link).up();
      entry.ele("description").txt(item.description || "").up();
      entry.ele("pubDate").txt(item.date).up();
      entry.up();
    });

    const xml = feed.end({ prettyPrint: true });
    fs.writeFileSync("feed-site6.xml", xml);

    console.log(`site6 完了: ${items.length}件`);

  } catch (err) {
    console.error("スクレイピングエラー (site6):", err);
    throw err; // ← process.exit(1) を使わない
  } finally {
    await browser.close(); // ← 成功時も失敗時も必ず Chrome を閉じる
  }
}

main();
