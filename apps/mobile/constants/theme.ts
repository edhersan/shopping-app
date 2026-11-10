import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import type { ColorSchemeName } from "react-native";

/**
 * Light Mode: Esquema Rojo y Blanco de alto contraste
 * - Fondo blanco limpio (#FFFFFF)
 * - Acentos y botones en rojo carmesí (#DC143C)
 * - Texto oscuro (#0F0F0F) sobre superficies claras y blanco (#FFFFFF) sobre rojo
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#DC143C",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FFE5EA",
    onPrimaryContainer: "#7A0019",
    secondary: "#B71C1C",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#FFDAD6",
    onSecondaryContainer: "#410002",
    tertiary: "#990024",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#FFD9DE",
    onTertiaryContainer: "#3F000B",
    background: "#FFFFFF",
    onBackground: "#0F0F0F",
    surface: "#FFFFFF",
    onSurface: "#0F0F0F",
    surfaceVariant: "#F5F5F5",
    onSurfaceVariant: "#424242",
    surfaceDisabled: "rgba(15, 15, 15, 0.12)",
    onSurfaceDisabled: "rgba(15, 15, 15, 0.38)",
    outline: "#D4D4D4",
    outlineVariant: "#E5E5E5",
    error: "#B00020",
    onError: "#FFFFFF",
    errorContainer: "#FCD8DF",
    onErrorContainer: "#370007",
    inverseSurface: "#121212",
    inverseOnSurface: "#FFFFFF",
    inversePrimary: "#FF4D6D",
    shadow: "#000000",
    scrim: "#000000",
    backdrop: "rgba(0, 0, 0, 0.5)",
    elevation: {
      level0: "transparent",
      level1: "#FAFAFA",
      level2: "#F5F5F5",
      level3: "#F0F0F0",
      level4: "#EBEBEB",
      level5: "#E6E6E6",
    },
  },
};

/**
 * Dark Mode: Esquema Rojo y Negro de alto contraste
 * - Fondo negro puro (#000000)
 * - Superficies en gris oscuro (#121212)
 * - Botones y acentos en rojo vibrante (#FF1744)
 */
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FF1744",
    onPrimary: "#FFFFFF",
    primaryContainer: "#4D0011",
    onPrimaryContainer: "#FFD9DF",
    secondary: "#FF5252",
    onSecondary: "#000000",
    secondaryContainer: "#5C0011",
    onSecondaryContainer: "#FFDAD6",
    tertiary: "#FF4081",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#560027",
    onTertiaryContainer: "#FFD9E2",
    background: "#000000",
    onBackground: "#FFFFFF",
    surface: "#121212",
    onSurface: "#FFFFFF",
    surfaceVariant: "#1E1E1E",
    onSurfaceVariant: "#BDBDBD",
    surfaceDisabled: "rgba(255, 255, 255, 0.12)",
    onSurfaceDisabled: "rgba(255, 255, 255, 0.38)",
    outline: "#333333",
    outlineVariant: "#262626",
    error: "#FF5252",
    onError: "#000000",
    errorContainer: "#93000A",
    onErrorContainer: "#FFDAD6",
    inverseSurface: "#FFFFFF",
    inverseOnSurface: "#000000",
    inversePrimary: "#DC143C",
    shadow: "#000000",
    scrim: "#000000",
    backdrop: "rgba(0, 0, 0, 0.7)",
    elevation: {
      level0: "transparent",
      level1: "#121212",
      level2: "#181818",
      level3: "#1E1E1E",
      level4: "#222222",
      level5: "#282828",
    },
  },
};

export function getAppTheme(colorScheme: ColorSchemeName): MD3Theme {
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
