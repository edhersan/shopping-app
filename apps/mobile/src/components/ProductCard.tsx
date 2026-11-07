import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { categoryLabel } from "../utils/catalog";
import { formatCurrency } from "../utils/format";
import { colors, radius, spacing } from "../utils/theme";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{categoryLabel(product.category)}</Text>
          </View>
          <Text style={styles.rating}>{product.rating.toFixed(1)} / 5</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            <Text
              style={[
                styles.stock,
                isOutOfStock ? styles.outOfStock : null,
                isLowStock ? styles.lowStock : null,
              ]}
            >
              {isOutOfStock ? "Agotado" : `${product.stock} disponibles`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${product.name} al carrito`}
            accessibilityState={{ disabled: isOutOfStock }}
            disabled={isOutOfStock}
            onPress={() => onAdd(product)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && !isOutOfStock ? styles.addButtonPressed : null,
              isOutOfStock ? styles.addButtonDisabled : null,
            ]}
          >
            <Text style={styles.addButtonLabel}>
              {isOutOfStock ? "Sin stock" : "Agregar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    backgroundColor: colors.surfaceMuted,
    height: 170,
    width: "100%",
  },
  body: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  rating: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  stock: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  lowStock: {
    color: colors.accent,
    fontWeight: "600",
  },
  outOfStock: {
    color: colors.danger,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
