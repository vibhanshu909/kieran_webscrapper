export interface Product {
  currency: string | "unknown";
  price: number | "unknown";
  quantity: number | "unknown";
  shipping:
    | {
        internationalShippingCost: number;
        nationalShippingCost: number;
      }
    | "unknown";
  description: string;
  primaryImage: string;
  otherImages: string[];
  type: string | "unknown";
  size: string | "unknown";
}
