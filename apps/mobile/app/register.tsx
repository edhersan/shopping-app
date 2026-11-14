import { useRouter } from "expo-router";
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

interface FormError {
  message: string;
  details: string[];
}

type FieldKey = "fullName" | "username" | "email" | "password";
type FieldErrors = Partial<Record<FieldKey, string>>;

function fieldForDetail(detail: string): FieldKey | null {
  const text = detail.toLowerCase();

  if (text.includes("nombre de usuario") || text.includes("usuario")) {
    return "username";
  }

  if (text.includes("correo") || text.includes("email")) {
    return "email";
  }

  if (text.includes("contraseña") || text.includes("password")) {
    return "password";
  }

  if (text.includes("nombre")) {
    return "fullName";
  }

  return null;
}

function mapFieldErrors(details: string[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const detail of details) {
    const field = fieldForDetail(detail);

    if (field !== null && errors[field] === undefined) {
      errors[field] = detail;
    }
  }

  return errors;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showError = (message: string, details: string[]): void => {
    setError({ message, details });
    setFieldErrors(mapFieldErrors(details));
  };

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await register({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result.success) {
        showError(result.message, result.details);
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
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para comprar y recibir tus facturas.
            </Text>
          </View>

          <View style={styles.card}>
            <TextField
              label="Nombre completo"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ana Torres"
              autoCapitalize="words"
              autoComplete="name"
              error={fieldErrors.fullName}
            />
            <TextField
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              placeholder="ana.torres"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              error={fieldErrors.username}
            />
            <TextField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="ana@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={fieldErrors.email}
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              secureTextEntry
              error={fieldErrors.password}
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error.message}</Text>
                {error.details.map((detail, index) => (
                  <Text key={`${index}-${detail}`} style={styles.errorDetail}>
                    • {detail}
                  </Text>
                ))}
              </View>
            ) : null}

            <PrimaryButton
              label="Registrarme"
              loading={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
            />
            <PrimaryButton
              label="Volver al inicio de sesión"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>

          <Text style={styles.note}>
            El usuario se crea en la persistencia del servicio y la sesión se guarda en el
            dispositivo.
          </Text>
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
  errorDetail: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
