import puppeteer from "puppeteer";
import fs from "fs";

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Apple Discussions Japan は JSで動的生成されるため、十分に待つ
  await page.goto("https://discussionsjapan.apple.com/browse?&sortBy=dateCreatedNewest", {
    waitUntil: "domcontentloaded",
    timeout: 90000
  });

  // ページが内部遷移を完了するまで待機（最大20秒）
  await new Promise(resolve => setTimeout(resolve, 20000));

  // ページ全体のHTMLを取得して確認
  const html = await page.content();

  // 投稿リンクを抽出（SPA対応：querySelectorAllが失敗してもフォールバック）
  const items = await page.evaluate(() => {
    const anchors = document.querySelectorAll("a[href*='/thread/']");
    return Array.from(anchors).map(a => ({
      title: a.innerText.trim(),
      url: a.href,
      timestamp: Date.now()
    }));
  });

  await browser.close();

  // フォルダ作成と保存
  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync("public/data.json", JSON.stringify(items, null, 2));

  console.log(`✅ ${items.length} 件の投稿を取得しました`);
}

main().catch(err => {
  console.error("❌ スクレイピング中にエラー:", err);
  process.exit(1);
});
