import fetch from "node-fetch";
import puppeteer from "puppeteer";
import type { ProductType } from "./types";

export interface Price {
  currencyName: string;
  priceAmount: string;
  internationalShippingCost: string;
  nationalShippingCost: string;
}

export interface Picture {
  id: number;
  width: number;
  height: number;
  url: string;
}

export interface Seller {
  verified: boolean;
  initials: string;
  id: number;
  picture: Picture[];
  username: string;
  reviewsRating: number;
  reviewsTotal: number;
  itemsSold: number;
  lastSeen: Date;
}

export interface Colour {
  id: string;
  name: string;
}

export interface ResponseProduct {
  id: number;
  address: string;
  countryCode: string;
  categoryId: number;
  price: Price;
  dateUpdated: Date;
  description: string;
  pictures: any[][];
  quantity: number;
  status: string;
  videos: any[];
  likeCount: number;
  seller: Seller;
  sizes?: {
    id: number;
    name: Exclude<ProductType["size"], "unknown">;
    quantity: number;
  }[];
  colour?: Colour[];
}

async function fetchProducts(shopId: string, offsetId?: string) {
  return await fetch(
    `https://webapi.depop.com/api/v1/shop/${shopId}/products/?limit=200${
      offsetId ? `&offset_id=${offsetId}` : ``
    }`
  ).then<{
    meta: { end: boolean; last_offset_id: string };
    products: { slug: string }[];
  }>((res) => res.json());
}

export const depopScrapper = async (
  ID: string
): Promise<Partial<ProductType>[]> => {
  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];
  await page.goto(`https://www.depop.com/${ID}/`);

  const NEXT_DATA = await page.evaluate(
    () =>
      document.querySelector("body > script#__NEXT_DATA__")?.textContent || ""
  );
  await browser.close();
  const shopId = JSON.parse(NEXT_DATA).props.pageProps.shop.id;

  const slugs: string[] = [];
  for (let offset_id = ""; true; ) {
    const { meta, products } = await fetchProducts(shopId, offset_id);
    slugs.push(...products.map(({ slug }) => slug));
    if (meta.end) {
      break;
    }
    offset_id = meta.last_offset_id;
  }

  return (
    await Promise.allSettled(
      slugs.map(async (slug) => {
        const { price, description, pictures, quantity, sizes } = await fetch(
          `https://webapi.depop.com/api/v2/product/${slug}/?lang=en`
        ).then<ResponseProduct>((res) => res.json());

        return {
          name: "unknown",
          currency: price.currencyName,
          price: parseFloat(price.priceAmount),
          quantity: quantity ?? "unknown",
          shipping: {
            international:
              parseFloat(price.internationalShippingCost) || "unknown",
            national: parseFloat(price.nationalShippingCost) || "unknown",
          },
          description: description.replace(/\s+\n*/gm, " ").trim(),
          image: pictures[0].slice(-1)[0].url,
          otherImages: pictures
            .slice(1)
            .map((picture) => picture.slice(-1)[0].url),
          size: sizes?.[0].name || "unknown",
          type: "unknown",
        } as Partial<ProductType>;
      })
    )
  ).reduce((prev, res) => {
    if (res.status === "fulfilled") {
      prev.push(res.value);
    }
    return prev;
  }, [] as Partial<ProductType>[]);
};
