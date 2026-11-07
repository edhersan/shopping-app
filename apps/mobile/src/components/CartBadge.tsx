import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../utils/theme";

export function CartBadge() {
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir carrito, ${itemCount} artículos`}
      hitSlop={8}
      onPress={() => router.push("/cart")}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
    >
      <Text style={styles.label}>Carrito</Text>
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{itemCount > 99 ? "99+" : itemCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
});
