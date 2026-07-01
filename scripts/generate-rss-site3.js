const fs = require("fs");
const { create } = require("xmlbuilder2");

const items = JSON.parse(fs.readFileSync("site3.json", "utf-8"));

const feed = create({ version: "1.0" })
  .ele("rss", { version: "2.0" })
  .ele("channel")
  .ele("title").txt("ライブドアブログ ヘッドライン").up()
  .ele("link").txt("https://blog.livedoor.com/headline/").up()
  .ele("description").txt("ライブドアブログ ヘッドライン 最新記事").up();

items.forEach(item => {
  feed.ele("item")
    .ele("title").txt(item.title).up()
    .ele("link").txt(item.link).up()
    .ele("guid").txt(item.link).up()
    .ele("pubDate").txt(item.date).up()
    .up();
});

const xml = feed.end({ prettyPrint: true });
fs.writeFileSync("feed-site3.xml", xml);
