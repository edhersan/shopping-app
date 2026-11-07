import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { CartItemRow } from "../src/components/CartItemRow";
import { EmptyState } from "../src/components/EmptyState";
import { PriceSummary } from "../src/components/PriceSummary";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenState } from "../src/components/ScreenState";
import { useCart } from "../src/context/CartContext";
import { calculateTotals } from "../src/utils/cart";
import { colors, spacing } from "../src/utils/theme";

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    hydrated,
    itemCount,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();
  const totals = calculateTotals(items);

  if (!hydrated) {
    return <ScreenState variant="loading" message="Cargando carrito..." />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          title="Tu carrito está vacío"
          message="Agrega productos del catálogo para comenzar tu compra."
          actionLabel="Ver catálogo"
          onAction={() => router.replace("/")}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <Text style={styles.count}>
            {itemCount} artículo{itemCount === 1 ? "" : "s"} en tu carrito
          </Text>
        }
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrement={() => incrementItem(item.product.id)}
            onDecrement={() => decrementItem(item.product.id)}
            onRemove={() => removeItem(item.product.id)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <PriceSummary
              subtotal={totals.subtotal}
              tax={totals.tax}
              shipping={totals.shipping}
              total={totals.total}
              note="Los totales se verifican nuevamente con el servidor al confirmar el pago."
            />
            <PrimaryButton
              label="Continuar al checkout"
              onPress={() => router.push("/checkout")}
            />
            <PrimaryButton
              label="Vaciar carrito"
              variant="secondary"
              onPress={clearCart}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
  count: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
