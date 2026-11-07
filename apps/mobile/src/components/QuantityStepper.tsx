import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../utils/theme";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  canIncrement?: boolean;
}

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  canIncrement = true,
}: QuantityStepperProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quitar una unidad"
        onPress={onDecrement}
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      >
        <Text style={styles.buttonLabel}>-</Text>
      </Pressable>
      <Text style={styles.quantity}>{quantity}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar una unidad"
        accessibilityState={{ disabled: !canIncrement }}
        disabled={!canIncrement}
        onPress={onIncrement}
        style={({ pressed }) => [
          styles.button,
          pressed && canIncrement ? styles.pressed : null,
          !canIncrement ? styles.disabled : null,
        ]}
      >
        <Text style={styles.buttonLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: "row",
    padding: 4,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  quantity: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: spacing.md,
    minWidth: 22,
    textAlign: "center",
  },
});
