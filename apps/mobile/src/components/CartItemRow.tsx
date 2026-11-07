import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "../utils/format";
import { colors, radius, spacing } from "../utils/theme";
import { QuantityStepper } from "./QuantityStepper";
import type { CartItem } from "../types";

interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  const lineTotal = item.product.price * item.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <Image
          source={{ uri: item.product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.unitPrice}>
            {formatCurrency(item.product.price)} c/u
          </Text>
          <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <QuantityStepper
          quantity={item.quantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          canIncrement={item.quantity < item.product.stock}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${item.product.name} del carrito`}
          onPress={onRemove}
          style={({ pressed }) => [pressed ? styles.pressed : null]}
        >
          <Text style={styles.removeLabel}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  mainRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  image: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 82,
    width: 82,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  unitPrice: {
    color: colors.textMuted,
    fontSize: 13,
  },
  lineTotal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  actionsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pressed: {
    opacity: 0.6,
  },
  removeLabel: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
