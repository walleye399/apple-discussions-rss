const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto("https://kuruma-news.jp/archive", {
    waitUntil: "networkidle0"
  });

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("article.archive-article")).map(el => ({
      title: el.querySelector("h2.archive-article__title")?.innerText || "",
      link: el.querySelector("a.archive-article__link")?.href || "",
      date: el.querySelector("time.archive-article__date")?.innerText || ""
    }));
  });

  fs.writeFileSync("site2.json", JSON.stringify(items, null, 2));
  await browser.close();
})();
