import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const page = await browser.newPage();

await page.goto(
  "https://discussionsjapan.apple.com/browse?sortBy=dateCreatedNewest",
  { waitUntil: "networkidle0" }
);

const items = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".discussion-item")).map(el => ({
    title: el.querySelector(".title")?.innerText || "",
    link: el.querySelector("a")?.href || "",
    date: el.querySelector(".date")?.innerText || ""
  }));
});

fs.writeFileSync("site1.json", JSON.stringify(items, null, 2));
await browser.close();
