import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { HeaderActions } from "../src/components/HeaderActions";
import { ScreenState } from "../src/components/ScreenState";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { colors } from "../src/utils/theme";
import { disableWebTranslation } from "../src/utils/webNoTranslate";

disableWebTranslation();

function useDisableWebTranslation(): void {
  useEffect(() => {
    disableWebTranslation();
  }, []);
}

function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return <ScreenState variant="loading" message="Cargando sesión..." />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Protected guard={user !== null}>
        <Stack.Screen
          name="index"
          options={{
            title: "Catálogo",
            headerRight: () => <HeaderActions />,
          }}
        />
        <Stack.Screen name="cart" options={{ title: "Carrito" }} />
        <Stack.Screen name="checkout" options={{ title: "Confirmar compra" }} />
      </Stack.Protected>
      <Stack.Protected guard={user === null}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useDisableWebTranslation();

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
