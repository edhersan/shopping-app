import type { ImageSourcePropType } from "react-native";
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

export const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  "p-001": require("../../assets/products/p-001.jpg"),
  "p-002": require("../../assets/products/p-002.jpg"),
  "p-003": require("../../assets/products/p-003.jpg"),
  "p-004": require("../../assets/products/p-004.jpg"),
  "p-005": require("../../assets/products/p-005.jpg"),
  "p-006": require("../../assets/products/p-006.jpg"),
  "p-007": require("../../assets/products/p-007.jpg"),
  "p-008": require("../../assets/products/p-008.jpg"),
  "p-009": require("../../assets/products/p-009.jpg"),
  "p-010": require("../../assets/products/p-010.jpg"),
  "p-011": require("../../assets/products/p-011.jpg"),
  "p-012": require("../../assets/products/p-012.jpg"),
};

export function getProductImageSource(
  productId: string,
  imageUrl: string,
): ImageSourcePropType {
  return PRODUCT_IMAGES[productId] ?? { uri: imageUrl };
}

export function categoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category];
}
