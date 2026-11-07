import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmptyState } from "../src/components/EmptyState";
import { ProductCard } from "../src/components/ProductCard";
import { ScreenState } from "../src/components/ScreenState";
import { useCart } from "../src/context/CartContext";
import { fetchProducts } from "../src/services/api";
import type { Product, ProductCategory } from "../src/types";
import { CATEGORY_OPTIONS } from "../src/utils/catalog";
import { colors, radius, spacing } from "../src/utils/theme";

type CategoryFilter = "all" | ProductCategory;

interface LoadOptions {
  mode: "initial" | "refresh";
  signal?: AbortSignal;
}

export default function CatalogScreen() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const loadProducts = useCallback(async ({ mode, signal }: LoadOptions): Promise<void> => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const data = await fetchProducts(signal);
      setProducts(data);
    } catch (requestError) {
      if (signal?.aborted) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el catálogo.",
      );
    } finally {
      if (!signal?.aborted) {
        if (mode === "initial") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts({ mode: "initial", signal: controller.signal });

    return () => controller.abort();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      const matchesTerm = term.length === 0 || haystack.includes(term);
      const matchesCategory = category === "all" || product.category === category;

      return matchesTerm && matchesCategory;
    });
  }, [products, search, category]);

  if (isLoading) {
    return <ScreenState variant="loading" message="Cargando catálogo..." />;
  }

  if (error) {
    return (
      <ScreenState
        variant="error"
        message={error}
        onRetry={() => {
          void loadProducts({ mode: "initial" });
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onAdd={(product) => addItem(product)} />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void loadProducts({ mode: "refresh" });
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar productos..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = option.value === category;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setCategory(option.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      isSelected ? styles.chipSelected : null,
                      pressed ? styles.chipPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        isSelected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.resultCount}>
              {filteredProducts.length} producto
              {filteredProducts.length === 1 ? "" : "s"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              title="Sin resultados"
              message="Prueba con otra búsqueda o selecciona una categoría diferente."
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
  header: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: colors.white,
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    paddingTop: spacing.xxl,
  },
});
