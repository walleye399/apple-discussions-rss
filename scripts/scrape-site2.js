import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();
await page.setDefaultNavigationTimeout(120000);

await page.goto("https://kuruma-news.jp/archive", {
  waitUntil: "networkidle2"
});

const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("li.p-archive__list-item")).map(el => ({
    title: el.querySelector("h3.p-archive__list-item__title")?.innerText || "",
    link: el.querySelector("a.p-archive__list-item__link")?.href || "",
    date: el.querySelector("time.p-archive__list-item__date")?.innerText || ""
  }));
});

fs.writeFileSync("site2.json", JSON.stringify(items, null, 2));
await browser.close();
