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

/** Combined apparel ladder — API has no gender, so admin does not split M/F. */
const APPAREL: SizeGuide = {
  id: "apparel",
  label: "Apparel",
  sizes: [
    { size: "XS" },
    { size: "S" },
    { size: "M" },
    { size: "L" },
    { size: "XL" },
    { size: "XXL" },
    { size: "XXXL" },
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

/**
 * Size options for the product form. Pass collection **slug** (not UUID).
 * Gender is not part of the admin API — guides are collection-only.
 */
export function getSizeGuide(collectionSlug: string): SizeGuide {
  if (collectionSlug === "underwear") return BOXER_SIZE_GUIDE;
  if (collectionSlug === "sunglasses") return ONE_SIZE;
  if (collectionSlug === "accessories") return ACCESSORIES;
  if (
    collectionSlug === "tops" ||
    collectionSlug === "bottoms" ||
    collectionSlug === "tracksuits" ||
    collectionSlug === "active-wear"
  ) {
    return APPAREL;
  }
  return APPAREL;
}

export function sizeGuideSizeLabels(guide: SizeGuide): string[] {
  return guide.sizes.map((s) => s.size);
}
