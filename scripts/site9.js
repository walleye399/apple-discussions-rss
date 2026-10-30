import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.prerele.com", {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  const html = await page.content();

  fs.writeFileSync("site9-debug.html", html);

  console.log("site9 debug HTML 保存完了");

  await browser.close();
}

main().catch(err => {
  console.error("site9 デバッグエラー:", err);
  process.exit(1);
});
