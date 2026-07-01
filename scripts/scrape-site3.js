import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();
await page.setDefaultNavigationTimeout(120000);

await page.goto("https://blog.livedoor.com/headline/", {
  waitUntil: "networkidle2"
});

const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("div.headline")).map(el => ({
    title: el.querySelector("h3.headline-title a")?.innerText || "",
    link: el.querySelector("h3.headline-title a")?.href || "",
    date: el.querySelector("div.headline-date")?.innerText || ""
  }));
});

fs.writeFileSync("site3.json", JSON.stringify(items, null, 2));
await browser.close();
