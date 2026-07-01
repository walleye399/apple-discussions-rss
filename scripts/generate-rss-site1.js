import fs from "fs";
import { create } from "xmlbuilder2";

const items = JSON.parse(fs.readFileSync("site1.json", "utf-8"));

const feed = create({ version: "1.0" })
  .ele("rss", { version: "2.0" })
  .ele("channel")
  .ele("title").txt("Apple Discussions Japan").up()
  .ele("link").txt("https://discussionsjapan.apple.com").up()
  .ele("description").txt("Apple Discussions Japan 最新投稿").up();

items.forEach(item => {
  feed.ele("item")
    .ele("title").txt(item.title).up()
    .ele("link").txt(item.link).up()
    .ele("guid").txt(item.link).up()
    .ele("pubDate").txt(item.date).up()
    .up();
});

const xml = feed.end({ prettyPrint: true });
fs.writeFileSync("feed-site1.xml", xml);
