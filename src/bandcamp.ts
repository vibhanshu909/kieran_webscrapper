import cheerio from "cheerio";
import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import { Product } from "./types";

export const bandcampScrapper = async (ID: string) => {
  const BASE_URL = `https://${ID}.bandcamp.com`;
  const URL = `${BASE_URL}/merch`;
  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];
  await page.goto(URL);

  const $ = cheerio.load(await page.content());
  await browser.close();

  const partialPayload = $("#merch-grid > li")
    .map((_, el) => ({
      href: $("a", el).attr("href"),
      data: {
        primaryImage: (() => {
          const img = $("img", el);
          return (img.attr("data-original") || img.attr("src"))?.replace(
            /_\w+./,
            "_10."
          );
        })(),
        type: (() => {
          const mimeType = $("div", el).text();
          const [_, type] = mimeType.split("/");
          return (type || _).replace(/\n*\s*/gm, "");
        })(),
        price:
          parseFloat($("p.price > span.price", el).text().trim().slice(1)) ||
          "unknown",
        currency: $("p.price > span.currency", el).text() || "unknown",
        quantity: $("p.price.sold-out", el).text() ? 0 : "unknown",
        shipping: "unknown",
        description: "",
        otherImages: [],
        size: "unknown",
      } as Product,
    }))
    .toArray();

  const products = (
    await Promise.allSettled(
      partialPayload.map(({ href, data }) => {
        const fn = href?.includes("merch")
          ? scrapeMerchProductPage
          : scrapeAlbumProductPage;
        return fn(href as string, data as Product);
      })
    )
  ).reduce((prev, res) => {
    if (res.status === "fulfilled") {
      prev.push(res.value);
    }
    return prev;
  }, [] as Product[]);

  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));

  async function scrapeMerchProductPage(link: string, product: Product) {
    const $ = cheerio.load(
      await fetch(`${BASE_URL}${link}`).then((res) => res.text())
    );

    const item = $("#merch-item");

    product.description = item
      .find("div.column.info > p")
      .text()
      .replace(/\s+\n*/gm, " ")
      .trim();

    product.quantity = parseInt(
      item.find("div.buy > div:nth-child(2) > span").text().match(/\d+/)?.[0] ??
        "0"
    );

    product.otherImages = item
      .find("div.column.art.popupImageGallery > ul > li > a")
      .map((_, el) => el.attribs["href"])
      .toArray();
    return product;
  }

  async function scrapeAlbumProductPage(link: string, product: Product) {
    const $ = cheerio.load(
      await fetch(`${BASE_URL}${link}`).then((res) => res.text())
    );

    product.description = $("#trackInfoInner > div.tralbumData.tralbum-credits")
      .text()
      .replace(/\s+\n*/gm, " ")
      .trim();

    return product;
  }
};
