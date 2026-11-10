export { darkTheme, getAppTheme, lightTheme } from "../../constants/theme";

export const colors = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f5f5f5",
  border: "#e5e5e5",
  text: "#0f0f0f",
  textMuted: "#525252",
  primary: "#dc143c",
  primaryPressed: "#b01030",
  primarySoft: "#ffe5ea",
  accent: "#d97706",
  danger: "#b00020",
  dangerSoft: "#fcd8df",
  success: "#15803d",
  successSoft: "#dcfce7",
  white: "#ffffff",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const theme = { colors, spacing, radius } as const;

export type AppTheme = typeof theme;
