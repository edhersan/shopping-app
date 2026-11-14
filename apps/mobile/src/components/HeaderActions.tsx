import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../utils/theme";
import { CartBadge } from "./CartBadge";

export function HeaderActions() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      {user?.role === "admin" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir panel de administrador"
          hitSlop={8}
          onPress={() => router.push("/admin")}
          style={({ pressed }) => [pressed ? styles.pressed : null]}
        >
          <Text style={styles.admin}>Admin</Text>
        </Pressable>
      ) : null}
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
  admin: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  logout: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
});
