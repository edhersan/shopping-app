import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenState } from "../src/components/ScreenState";
import { useAuth } from "../src/context/AuthContext";
import {
  ApiClientError,
  deleteAdminUser,
  fetchAdminOrders,
  fetchAdminUsers,
  fetchProducts,
  updateProductStock,
} from "../src/services/api";
import { formatCurrency, formatDate } from "../src/utils/format";
import { colors, radius, spacing } from "../src/utils/theme";
import type { AuthUser, Order, Product } from "../src/types";

type LoadMode = "initial" | "refresh";

function readableError(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export default function AdminScreen() {
  const { user, token, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: LoadMode): Promise<void> => {
      if (!token) {
        return;
      }

      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const [productsData, usersData, ordersData] = await Promise.all([
          fetchProducts(),
          fetchAdminUsers(token),
          fetchAdminOrders(token),
        ]);

        setProducts(productsData);
        setUsers(usersData);
        setOrders(ordersData);
      } catch (requestError) {
        if (requestError instanceof ApiClientError && requestError.status === 401) {
          logout();
          return;
        }

        setError(
          readableError(requestError, "No se pudo cargar el panel de administrador."),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, logout],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const handleStock = async (product: Product, delta: number): Promise<void> => {
    if (!token) {
      return;
    }

    const nextStock = Math.max(0, Math.min(999, product.stock + delta));

    if (nextStock === product.stock) {
      return;
    }

    setActionError(null);
    setUpdatingId(product.id);

    try {
      const updated = await updateProductStock(token, product.id, nextStock);
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      if (requestError instanceof ApiClientError && requestError.status === 401) {
        logout();
        return;
      }

      setActionError(readableError(requestError, "No se pudo actualizar el stock."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (target: AuthUser): Promise<void> => {
    if (!token) {
      return;
    }

    setActionError(null);
    setDeletingId(target.id);

    try {
      await deleteAdminUser(token, target.id);
      setUsers((current) => current.filter((item) => item.id !== target.id));
      setPendingDeleteId(null);
    } catch (requestError) {
      if (requestError instanceof ApiClientError && requestError.status === 401) {
        logout();
        return;
      }

      setActionError(
        readableError(requestError, "No se pudo eliminar el usuario."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || user.role !== "admin" || !token) {
    return <Redirect href="/" />;
  }

  if (isLoading) {
    return <ScreenState variant="loading" message="Cargando panel..." />;
  }

  if (error) {
    return (
      <ScreenState
        variant="error"
        message={error}
        onRetry={() => {
          void load("initial");
        }}
      />
    );
  }

  const totalStock = products.reduce((total, product) => total + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;
  const outOfStock = products.filter((product) => product.stock <= 0).length;
  const revenue = orders
    .filter((order) => order.status === "paid")
    .reduce((total, order) => total + order.total, 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void load("refresh");
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Hola, {user.fullName}</Text>
          <Text style={styles.heroText}>
            Administra el inventario, los usuarios registrados y las órdenes.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStock}</Text>
            <Text style={styles.statLabel}>Unidades en stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, lowStock + outOfStock > 0 ? styles.warningValue : null]}>
              {lowStock + outOfStock}
            </Text>
            <Text style={styles.statLabel}>Alertas de stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>

        {actionError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventario y stock</Text>
            <Text style={styles.sectionMeta}>{outOfStock} agotados</Text>
          </View>
          {products.map((product) => {
            const isUpdating = updatingId === product.id;

            return (
              <View key={product.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.rowMeta,
                      product.stock <= 0 ? styles.outOfStock : null,
                      product.stock > 0 && product.stock <= 5 ? styles.lowStock : null,
                    ]}
                  >
                    Stock: {product.stock}
                  </Text>
                </View>
                <View style={styles.stockActions}>
                  {isUpdating ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar una unidad a ${product.name}`}
                        disabled={product.stock <= 0}
                        onPress={() => {
                          void handleStock(product, -1);
                        }}
                        style={({ pressed }) => [
                          styles.stockButton,
                          pressed ? styles.pressed : null,
                          product.stock <= 0 ? styles.stockButtonDisabled : null,
                        ]}
                      >
                        <Text style={styles.stockButtonLabel}>-1</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Agregar una unidad a ${product.name}`}
                        onPress={() => {
                          void handleStock(product, 1);
                        }}
                        style={({ pressed }) => [
                          styles.stockButton,
                          styles.stockButtonAdd,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <Text style={[styles.stockButtonLabel, styles.stockButtonAddLabel]}>
                          +1
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Agregar diez unidades a ${product.name}`}
                        onPress={() => {
                          void handleStock(product, 10);
                        }}
                        style={({ pressed }) => [
                          styles.stockButton,
                          styles.stockButtonAdd,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <Text style={[styles.stockButtonLabel, styles.stockButtonAddLabel]}>
                          +10
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios registrados</Text>
            <Text style={styles.sectionMeta}>{users.length}</Text>
          </View>
          {users.map((item) => {
            const isPending = pendingDeleteId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    @{item.username} · {item.email}
                  </Text>
                </View>
                <View style={styles.userActions}>
                  <View
                    style={[
                      styles.rolePill,
                      item.role === "admin" ? styles.roleAdmin : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleLabel,
                        item.role === "admin" ? styles.roleAdminLabel : null,
                      ]}
                    >
                      {item.role === "admin" ? "Admin" : "Cliente"}
                    </Text>
                  </View>
                  {item.role !== "admin" ? (
                    isPending ? (
                      <View style={styles.confirmActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Confirmar eliminación de ${item.username}`}
                          disabled={isDeleting}
                          onPress={() => {
                            void handleDeleteUser(item);
                          }}
                          style={({ pressed }) => [
                            styles.deleteConfirm,
                            pressed ? styles.pressed : null,
                            isDeleting ? styles.stockButtonDisabled : null,
                          ]}
                        >
                          <Text style={styles.deleteConfirmLabel}>
                            {isDeleting ? "..." : "Confirmar"}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Cancelar eliminación de ${item.username}`}
                          disabled={isDeleting}
                          onPress={() => setPendingDeleteId(null)}
                          style={({ pressed }) => [
                            styles.cancelButton,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Text style={styles.cancelLabel}>Cancelar</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar usuario ${item.username}`}
                        onPress={() => setPendingDeleteId(item.id)}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <Text style={styles.deleteLabel}>Eliminar</Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Órdenes</Text>
            <Text style={styles.sectionMeta}>{formatCurrency(revenue)} pagado</Text>
          </View>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>
              Aún no hay órdenes. Realiza una compra para verla aquí.
            </Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {order.id}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {order.customer.fullName} · {formatDate(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      order.status === "paid" ? styles.statusPaid : styles.statusDeclined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusLabel,
                        order.status === "paid"
                          ? styles.statusPaidLabel
                          : styles.statusDeclinedLabel,
                      ]}
                    >
                      {order.status === "paid" ? "Pagada" : "Rechazada"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    gap: 4,
    padding: spacing.lg,
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  heroText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: "45%",
    gap: 2,
    padding: spacing.lg,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  warningValue: {
    color: colors.accent,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  lowStock: {
    color: colors.accent,
    fontWeight: "700",
  },
  outOfStock: {
    color: colors.danger,
    fontWeight: "700",
  },
  stockActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 120,
    justifyContent: "flex-end",
  },
  stockButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
  },
  stockButtonAdd: {
    backgroundColor: colors.primary,
  },
  stockButtonDisabled: {
    opacity: 0.4,
  },
  stockButtonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  stockButtonAddLabel: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
  rolePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleAdmin: {
    backgroundColor: colors.primarySoft,
  },
  roleLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  roleAdminLabel: {
    color: colors.primary,
  },
  userActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  deleteButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  deleteLabel: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  deleteConfirm: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deleteConfirmLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  cancelLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  orderMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  orderTotal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  statusPaid: {
    backgroundColor: colors.successSoft,
  },
  statusDeclined: {
    backgroundColor: colors.dangerSoft,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPaidLabel: {
    color: colors.success,
  },
  statusDeclinedLabel: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
