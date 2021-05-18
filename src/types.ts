import { Static, Type } from "@sinclair/typebox";

const __ = Type.Void();

const Currency = Type.KeyOf(
  Type.Object({
    Unknown: __,
    USD: __,
  })
);
type CurrencyType = Static<typeof Currency>;

const ProductCategory = Type.KeyOf(
  Type.Object({
    Apparel: __,
    Vinyl: __,
    CompactDiscCD: __,
    Cassette: __,
    Print: __,
  })
);
type ProductCategoryType = Static<typeof ProductCategory>;

const ProductSize = Type.KeyOf(
  Type.Object({
    XS: __,
    S: __,
    M: __,
    L: __,
    XL: __,
    XXL: __,
    unknown: __,
  })
);
type ProductSizeType = Static<typeof ProductSize>;

const unknown = Type.Literal("unknown");
const unknownOrFloat = Type.Union([unknown, Type.Number()]);
const unknownOrInt = Type.Union([unknown, Type.Integer()]);

const Shipping = Type.Object({
  international: unknownOrFloat,
  national: unknownOrFloat,
});

const urlExp =
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
const URL = Type.RegEx(urlExp);

export const Product = Type.Object({
  name: Type.Union([unknown, Type.String()]),
  description: Type.String(),
  currency: Currency,
  price: unknownOrFloat,
  quantity: unknownOrInt,
  shipping: Type.Union([unknown, Shipping]),
  image: URL,
  otherImages: Type.Array(URL),
  type: Type.Union([unknown, ProductCategory]),
  size: ProductSize,
});

export type ProductType = Static<typeof Product>;

export interface ProductTypea {
  currency: string | "unknown";
  price: number | "unknown";
  quantity: number | "unknown";
  shipping:
    | {
        international: number;
        national: number;
      }
    | "unknown";
  description: string;
  primaryImage: string;
  otherImages: string[];
  type: string | "unknown";
  size: string | "unknown";
}
