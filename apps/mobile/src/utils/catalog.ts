import type { ProductCategory } from "../types";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: "Electrónica",
  clothing: "Ropa",
  home: "Hogar",
  sports: "Deportes",
};

export interface CategoryOption {
  value: "all" | ProductCategory;
  label: string;
}

export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { value: "all", label: "Todos" },
  { value: "electronics", label: CATEGORY_LABELS.electronics },
  { value: "clothing", label: CATEGORY_LABELS.clothing },
  { value: "home", label: CATEGORY_LABELS.home },
  { value: "sports", label: CATEGORY_LABELS.sports },
];

export function categoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category];
}
