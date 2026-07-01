import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();
await page.setDefaultNavigationTimeout(120000);

await page.goto(
  "https://discussionsjapan.apple.com/browse?sortBy=dateCreatedNewest",
  { waitUntil: "networkidle2" }
);

const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('div[data-testid="topic-list-item"]')).map(el => ({
    title: el.querySelector('a[data-testid="topic-title-link"]')?.innerText || "",
    link: el.querySelector('a[data-testid="topic-title-link"]')?.href || "",
    date: el.querySelector('time[data-testid="topic-timestamp"]')?.innerText || ""
  }));
});

fs.writeFileSync("site1.json", JSON.stringify(items, null, 2));
await browser.close();
