export type SizeGuideEntry = {
  size: string;
  inches?: string;
  cm?: string;
};

export type SizeGuide = {
  id: string;
  label: string;
  eyebrow?: string;
  sizes: SizeGuideEntry[];
};

/** Matches storefront BoxerSizeGuide (Intimates & Boxers). */
export const BOXER_SIZE_GUIDE: SizeGuide = {
  id: "underwear",
  label: "Intimates & Boxers",
  eyebrow: "Intimates & Boxers",
  sizes: [
    { size: "S", inches: "29 - 32", cm: "74 - 80" },
    { size: "M", inches: "32 - 34", cm: "80 - 86" },
    { size: "L", inches: "34 - 37", cm: "86 - 94" },
    { size: "XL", inches: "37 - 39", cm: "94 - 100" },
    { size: "XXL", inches: "39 - 42", cm: "100 - 106" },
    { size: "XXXL", inches: "42 - 45", cm: "106 - 114" },
  ],
};

const MENS_APPAREL: SizeGuide = {
  id: "mens-apparel",
  label: "Men's apparel",
  sizes: [
    { size: "S" },
    { size: "M" },
    { size: "L" },
    { size: "XL" },
    { size: "XXL" },
  ],
};

const WOMENS_APPAREL: SizeGuide = {
  id: "womens-apparel",
  label: "Women's apparel",
  sizes: [
    { size: "XS" },
    { size: "S" },
    { size: "M" },
    { size: "L" },
    { size: "XL" },
  ],
};

const ONE_SIZE: SizeGuide = {
  id: "one-size",
  label: "One size",
  sizes: [{ size: "One Size" }],
};

const ACCESSORIES: SizeGuide = {
  id: "accessories",
  label: "Accessories",
  sizes: [{ size: "One Size" }, { size: "S/M" }, { size: "L/XL" }],
};

export function getSizeGuide(
  collectionId: string,
  gender: "male" | "female" | "unisex",
): SizeGuide {
  if (collectionId === "underwear") return BOXER_SIZE_GUIDE;
  if (collectionId === "sunglasses") return ONE_SIZE;
  if (collectionId === "accessories") return ACCESSORIES;
  if (
    collectionId === "tops" ||
    collectionId === "bottoms" ||
    collectionId === "tracksuits" ||
    collectionId === "active-wear"
  ) {
    return gender === "female" ? WOMENS_APPAREL : MENS_APPAREL;
  }
  return MENS_APPAREL;
}

export function sizeGuideSizeLabels(guide: SizeGuide): string[] {
  return guide.sizes.map((s) => s.size);
}
