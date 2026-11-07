import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { TextField } from "../src/components/TextField";
import { useAuth } from "../src/context/AuthContext";
import { colors, radius, spacing } from "../src/utils/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setError(null);

    if (username.trim().length === 0 || password.length === 0) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.title}>Shopping App</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para explorar el catálogo y completar tus compras.
            </Text>
          </View>

          <View style={styles.card}>
            <TextField
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              placeholder="expo"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Iniciar sesión"
              loading={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Credenciales de prueba</Text>
            <Text style={styles.demoText}>
              Usuario: <Text style={styles.demoValue}>expo</Text>
            </Text>
            <Text style={styles.demoText}>
              Contraseña: <Text style={styles.demoValue}>1234</Text>
            </Text>
            <Text style={styles.demoNote}>
              Demo académica: la sesión se guarda en el dispositivo con AsyncStorage.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: "center",
    maxWidth: 440,
    padding: spacing.xl,
    width: "100%",
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 64,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 64,
  },
  logoText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
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
  demoCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    gap: 4,
    padding: spacing.lg,
  },
  demoTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  demoText: {
    color: colors.primary,
    fontSize: 14,
  },
  demoValue: {
    fontWeight: "800",
  },
  demoNote: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
    opacity: 0.8,
  },
});
