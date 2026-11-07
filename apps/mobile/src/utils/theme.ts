export const colors = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  primary: "#0f766e",
  primaryPressed: "#115e59",
  primarySoft: "#ccfbf1",
  accent: "#f59e0b",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
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
