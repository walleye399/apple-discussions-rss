const fs = require("fs");
const { create } = require("xmlbuilder2");

const items = JSON.parse(fs.readFileSync("site2.json", "utf-8"));

const feed = create({ version: "1.0" })
  .ele("rss", { version: "2.0" })
  .ele("channel")
  .ele("title").txt("くるまニュース").up()
  .ele("link").txt("https://kuruma-news.jp/archive").up()
  .ele("description").txt("くるまニュース 最新記事").up();

items.forEach(item => {
  feed.ele("item")
    .ele("title").txt(item.title).up()
    .ele("link").txt(item.link).up()
    .ele("guid").txt(item.link).up()
    .ele("pubDate").txt(item.date).up()
    .up();
});

const xml = feed.end({ prettyPrint: true });
fs.writeFileSync("feed-site2.xml", xml);
