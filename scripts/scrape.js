import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://discussionsjapan.apple.com/browse", {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  // ページが安定するまで待機（5秒）
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 投稿リンクが出るまで待機
  await page.waitForSelector("a[data-testid='thread-link']", { timeout: 30000 });

  const items = await page.evaluate(() => {
    const nodes = document.querySelectorAll("a[data-testid='thread-link']");
    return Array.from(nodes).map(n => ({
      title: n.innerText.trim(),
      url: n.href,
      timestamp: Date.now()
    }));
  });

  await browser.close();

  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync("public/data.json", JSON.stringify(items, null, 2));
}

main();
