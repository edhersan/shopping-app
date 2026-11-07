import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../utils/theme";
import { CartBadge } from "./CartBadge";

export function HeaderActions() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <CartBadge />
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        hitSlop={8}
        onPress={logout}
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        <Text style={styles.logout}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  divider: {
    backgroundColor: colors.border,
    height: 18,
    width: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  logout: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
});
