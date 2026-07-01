import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

// タイムアウト延長（重要）
await page.setDefaultNavigationTimeout(120000);
await page.setDefaultTimeout(120000);

await page.goto("https://kuruma-news.jp/archive", {
  waitUntil: "networkidle2"   // networkidle0 は重いサイトで固まりやすい
});

// くるまニュースの構造に合わせたセレクタ
const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("article.archive-article")).map(el => ({
    title: el.querySelector("h2.archive-article__title")?.innerText || "",
    link: el.querySelector("a.archive-article__link")?.href || "",
    date: el.querySelector("time.archive-article__date")?.innerText || ""
  }));
});

fs.writeFileSync("site2.json", JSON.stringify(items, null, 2));
await browser.close();
