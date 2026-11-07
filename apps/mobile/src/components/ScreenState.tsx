import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../utils/theme";
import { PrimaryButton } from "./PrimaryButton";

interface ScreenStateProps {
  variant: "loading" | "error";
  message: string;
  onRetry?: () => void;
}

export function ScreenState({ variant, message, onRetry }: ScreenStateProps) {
  return (
    <View style={styles.container}>
      {variant === "loading" ? (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.message}>{message}</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>{message}</Text>
          {onRetry ? (
            <PrimaryButton
              label="Reintentar"
              onPress={onRetry}
              variant="secondary"
              style={styles.action}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  action: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
