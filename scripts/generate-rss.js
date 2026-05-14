import fs from "fs";
import { create } from "xmlbuilder2";

const items = JSON.parse(fs.readFileSync("public/data.json", "utf-8"));

const feed = create({ version: "1.0", encoding: "UTF-8" })
  .ele("rss", { version: "2.0" })
  .ele("channel")
  .ele("title").txt("Apple Discussions Japan RSS").up()
  .ele("link").txt("https://discussionsjapan.apple.com/browse").up()
  .ele("description").txt("Unofficial RSS feed").up();

items.forEach(item => {
  feed
    .ele("item")
    .ele("title").txt(item.title).up()
    .ele("link").txt(item.url).up()
    .ele("pubDate").txt(new Date(item.timestamp).toUTCString()).up()
    .up();
});

const xml = feed.end({ prettyPrint: true });
fs.writeFileSync("feed.xml", xml);
