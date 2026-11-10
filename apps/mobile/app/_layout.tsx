import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider, useTheme } from "react-native-paper";
import { darkTheme, lightTheme } from "../constants/theme";
import { HeaderActions } from "../src/components/HeaderActions";
import { ScreenState } from "../src/components/ScreenState";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { disableWebTranslation } from "../src/utils/webNoTranslate";

disableWebTranslation();

function useDisableWebTranslation(): void {
  useEffect(() => {
    disableWebTranslation();
  }, []);
}

function RootNavigator() {
  const { user, hydrated } = useAuth();
  const paperTheme = useTheme();

  if (!hydrated) {
    return <ScreenState variant="loading" message="Cargando sesión..." />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: paperTheme.colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: paperTheme.colors.surface },
        headerTintColor: paperTheme.colors.onSurface,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const paperTheme = isDark ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <CartProvider>
          <StatusBar style={isDark ? "light" : "dark"} />
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
