import cheerio, { CheerioAPI, Element } from "cheerio";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import type { ProductType } from "./types";

const primaryImage = ($: CheerioAPI, merchGridLI: Element) => {
  const img = $("img", merchGridLI);
  return (img.attr("data-original") || img.attr("src"))?.replace(
    /_\w+./,
    "_10."
  );
};

const type = ($: CheerioAPI, merchGridLI: Element) => {
  const mimeType = $("div", merchGridLI).text();
  const [_, type] = mimeType.split("/");
  return (type || _).replace(/\n*\s*/gm, "");
};

export const bandcampScrapper = async (
  ID: string
): Promise<Partial<ProductType>[]> => {
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
        name: $("a > p.title", el).text().replace(/\s+/g, " ").trim(),
        image: primaryImage($, el),
        type: type($, el),
        price:
          parseFloat($("p.price > span.price", el).text().trim().slice(1)) ||
          "unknown",
        currency: $("p.price > span.currency", el).text() || "unknown",
        quantity: $("p.price.sold-out", el).text() ? 0 : "unknown",
        shipping: "unknown",
        description: "",
        otherImages: [],
        size: "unknown",
      } as Partial<ProductType>,
    }))
    .toArray();

  return (
    await Promise.allSettled(
      partialPayload.map(async ({ href, data }) => {
        const fn = href?.includes("merch")
          ? scrapeMerchProductPage
          : scrapeAlbumProductPage;
        const patched = await fn(`${BASE_URL}${href}`);
        return { ...data, ...patched };
      })
    )
  ).reduce((prev, res) => {
    if (res.status === "fulfilled") {
      return [...prev, res.value];
    } else if (res.status === "rejected") {
      console.error("Rejected status", res.reason);
    }

    return prev;
  }, [] as Partial<ProductType>[]);
};

async function scrapeMerchProductPage(
  link: string
): Promise<Partial<ProductType>> {
  const $ = cheerio.load(await fetch(link).then((res) => res.text()));
  const item = $("#merch-item");

  return {
    description: item
      .find("div.column.info > p")
      .text()
      .replace(/\s+\n*/gm, " ")
      .trim(),

    quantity: parseInt(
      item.find("div.buy > div:nth-child(2) > span").text().match(/\d+/)?.[0] ??
        "0"
    ),

    otherImages: item
      .find("div.column.art.popupImageGallery > ul > li > a")
      .map((_, el) => el.attribs["href"])
      .toArray(),
  };
}

async function scrapeAlbumProductPage(
  link: string
): Promise<Partial<ProductType>> {
  const $ = cheerio.load(await fetch(link).then((res) => res.text()));

  return {
    description: $("#trackInfoInner > div.tralbumData.tralbum-credits")
      .text()
      .replace(/\s+\n*/gm, " ")
      .trim(),
  };
}
