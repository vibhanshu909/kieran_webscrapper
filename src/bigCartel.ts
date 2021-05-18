import cheerio from "cheerio";
import fetch from "node-fetch";
import parser from "xml2json";
import { ProductType } from "./types";

export const bigCartelScrapper = async (ID: string): Promise<ProductType[]> => {
  const BASE_URL = `https://${ID}.bigcartel.com`;

  const $ = cheerio.load(await fetch(BASE_URL).then((res) => res.text()));
  const link = $('head > link[rel="alternate"]').get(0).attribs["href"];
  const xml = await fetch(link).then((res) => res.text());
  const json = parser.toJson(xml, { object: true }) as any;

  return json.rss.channel.item.map((item: any) => ({
    name: item["g:title"],
    description: cheerio
      .load(item["g:description"])
      .text()
      .replace(/\s+\n*/gm, " ")
      .trim(),
    price: parseFloat(item["g:price"].split(" ")[0]) || "unknown",
    currency: item["g:price"].split(" ")[1] || "unknown",
    quantity: item["g:availability"] === "out of stock" ? 0 : "unknown",
    image: item["g:image_link"],
    otherImages:
      typeof item["g:additional_image_link"] === "string"
        ? item["g:additional_image_link"].split(",")
        : [],
    shipping: "unknown",
    type: "unknown",
    size: "unknown",
  }));
};
