import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

await page.goto("https://blog.livedoor.com/headline/", {
  waitUntil: "networkidle0"
});

const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("div.article")).map(el => ({
    title: el.querySelector("h3.article-title")?.innerText || "",
    link: el.querySelector("a.article-title-link")?.href || "",
    date: el.querySelector("span.article-date")?.innerText || ""
  }));
});

fs.writeFileSync("site3.json", JSON.stringify(items, null, 2));
await browser.close();
