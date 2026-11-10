import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../src/components/EmptyState";
import { PriceSummary } from "../src/components/PriceSummary";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenState } from "../src/components/ScreenState";
import { TextField } from "../src/components/TextField";
import { useCart } from "../src/context/CartContext";
import { ApiClientError, createOrder, validateCart } from "../src/services/api";
import { downloadInvoice } from "../src/services/invoice";
import type {
  Customer,
  Order,
  PaymentRequest,
  PricingSummary,
} from "../src/types";
import { calculateTotals } from "../src/utils/cart";
import { SAVED_CARD } from "../src/utils/constants";
import {
  formatCardNumberInput,
  formatCurrency,
  formatDate,
  formatExpiryInput,
} from "../src/utils/format";
import { colors, radius, spacing } from "../src/utils/theme";

interface CheckoutFormState {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvv: string;
}

type FieldErrors = Partial<Record<keyof CheckoutFormState, string>>;

const INITIAL_FORM: CheckoutFormState = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  zipCode: "",
  cardNumber: formatCardNumberInput(SAVED_CARD.cardNumber),
  holderName: SAVED_CARD.holderName,
  expiry: SAVED_CARD.expiry,
  cvv: SAVED_CARD.cvv,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^[0-9A-Za-z -]{3,10}$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CARD_PATTERN = /^\d{13,19}$/;
const CVV_PATTERN = /^\d{3,4}$/;

function validateForm(form: CheckoutFormState): FieldErrors {
  const errors: FieldErrors = {};
  const cardDigits = form.cardNumber.replace(/\s/g, "");

  if (form.fullName.trim().length < 3) {
    errors.fullName = "Ingresa tu nombre completo.";
  }

  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (form.address.trim().length < 5) {
    errors.address = "Ingresa una dirección válida.";
  }

  if (form.city.trim().length < 2) {
    errors.city = "Ingresa tu ciudad.";
  }

  if (!ZIP_PATTERN.test(form.zipCode.trim())) {
    errors.zipCode = "Ingresa un código postal válido.";
  }

  if (!CARD_PATTERN.test(cardDigits)) {
    errors.cardNumber = "La tarjeta debe tener entre 13 y 19 dígitos.";
  }

  if (form.holderName.trim().length < 3) {
    errors.holderName = "Ingresa el nombre del titular.";
  }

  if (!EXPIRY_PATTERN.test(form.expiry)) {
    errors.expiry = "Usa el formato MM/AA.";
  }

  if (!CVV_PATTERN.test(form.cvv)) {
    errors.cvv = "El CVV debe tener 3 o 4 dígitos.";
  }

  return errors;
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [serverPricing, setServerPricing] = useState<PricingSummary | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setServerPricing(null);
      return;
    }

    const controller = new AbortController();
    const lines = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    void validateCart(lines, controller.signal)
      .then((pricing) => {
        if (!controller.signal.aborted) {
          setServerPricing(pricing);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setServerPricing(null);
        }
      });

    return () => controller.abort();
  }, [items, hydrated]);

  const updateField = (field: keyof CheckoutFormState, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const useSavedCard = (): void => {
    updateField("cardNumber", formatCardNumberInput(SAVED_CARD.cardNumber));
    updateField("holderName", SAVED_CARD.holderName);
    updateField("expiry", SAVED_CARD.expiry);
    updateField("cvv", SAVED_CARD.cvv);
  };

  const handleDownloadInvoice = async (): Promise<void> => {
    if (!confirmedOrder) {
      return;
    }

    setInvoiceError(null);
    setIsGeneratingInvoice(true);

    try {
      await downloadInvoice(confirmedOrder);
    } catch (error) {
      setInvoiceError(
        error instanceof Error
          ? error.message
          : "No se pudo generar la factura PDF.",
      );
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const errors = validateForm(form);
    setFieldErrors(errors);
    setSubmissionError(null);
    setSubmissionDetails([]);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const customer: Customer = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      zipCode: form.zipCode.trim(),
    };

    const payment: PaymentRequest = {
      cardNumber: form.cardNumber.replace(/\s/g, ""),
      holderName: form.holderName.trim(),
      expiry: form.expiry,
      cvv: form.cvv,
    };

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customer,
        payment,
      });

      setConfirmedOrder(order);
      clearCart();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmissionError(error.message);
        setSubmissionDetails(error.details ?? []);
      } else {
        setSubmissionError("No se pudo procesar el pedido. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationKicker}>Pago aprobado</Text>
          <Text style={styles.confirmationTitle}>Gracias por tu compra</Text>
          <Text style={styles.confirmationMessage}>
            Tu pedido fue registrado correctamente. Descarga y muestra la factura en PDF.
          </Text>
          <View style={styles.summaryBlock}>
            <SummaryRow label="Orden" value={confirmedOrder.id} />
            <SummaryRow
              label="Estado"
              value={confirmedOrder.status === "paid" ? "Pagado" : "Rechazado"}
            />
            <SummaryRow label="Total" value={formatCurrency(confirmedOrder.total)} />
            <SummaryRow
              label="Tarjeta"
              value={`${confirmedOrder.payment.brand} **** ${confirmedOrder.payment.last4}`}
            />
            <SummaryRow label="Fecha" value={formatDate(confirmedOrder.createdAt)} />
            <SummaryRow
              label="Artículos"
              value={String(
                confirmedOrder.items.reduce(
                  (accumulator, item) => accumulator + item.quantity,
                  0,
                ),
              )}
            />
          </View>
          <Text style={styles.confirmationNote}>
            Nota académica: las órdenes se guardan en memoria y se pierden al reiniciar el servicio.
          </Text>
        </View>
        <PrimaryButton
          label="Descargar y mostrar factura PDF"
          loading={isGeneratingInvoice}
          onPress={() => {
            void handleDownloadInvoice();
          }}
        />
        {invoiceError ? (
          <Text style={styles.invoiceError}>{invoiceError}</Text>
        ) : null}
        <PrimaryButton
          label="Volver al catálogo"
          variant="secondary"
          onPress={() => router.replace("/")}
        />
      </ScrollView>
    );
  }

  if (!hydrated) {
    return <ScreenState variant="loading" message="Cargando checkout..." />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          title="No hay productos para pagar"
          message="Agrega productos al carrito antes de continuar con el checkout."
          actionLabel="Ver catálogo"
          onAction={() => router.replace("/")}
        />
      </View>
    );
  }

  const totals = calculateTotals(items);
  const subtotal = serverPricing?.subtotal ?? totals.subtotal;
  const tax = serverPricing?.tax ?? totals.tax;
  const shipping = serverPricing?.shipping ?? totals.shipping;
  const total = serverPricing?.total ?? totals.total;
  const pricingNote = serverPricing
    ? "Totales verificados por el microservicio de carrito."
    : "Totales estimados; el servidor los verificará al confirmar el pago.";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Datos de entrega</Text>
        <TextField
          label="Nombre completo"
          value={form.fullName}
          onChangeText={(value) => updateField("fullName", value)}
          placeholder="Ana Torres"
          autoCapitalize="words"
          autoComplete="name"
          error={fieldErrors.fullName}
        />
        <TextField
          label="Correo electrónico"
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="ana@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <TextField
          label="Dirección"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="Calle 123 # 45-67"
          autoComplete="street-address"
          error={fieldErrors.address}
        />
        <TextField
          label="Ciudad"
          value={form.city}
          onChangeText={(value) => updateField("city", value)}
          placeholder="Bogotá"
          autoCapitalize="words"
          error={fieldErrors.city}
        />
        <TextField
          label="Código postal"
          value={form.zipCode}
          onChangeText={(value) => updateField("zipCode", value)}
          placeholder="110111"
          keyboardType="number-pad"
          autoComplete="postal-code"
          maxLength={10}
          error={fieldErrors.zipCode}
        />

        <Text style={styles.sectionTitle}>Datos de pago</Text>
        <View style={styles.savedCardBox}>
          <View style={styles.savedCardInfo}>
            <Text style={styles.savedCardLabel}>Tarjeta configurada</Text>
            <Text style={styles.savedCardValue}>
              {SAVED_CARD.brand} •••• {SAVED_CARD.last4} · vence {SAVED_CARD.expiry}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar tarjeta configurada"
            onPress={useSavedCard}
            style={({ pressed }) => [
              styles.savedCardButton,
              pressed ? styles.savedCardButtonPressed : null,
            ]}
          >
            <Text style={styles.savedCardButtonLabel}>Usar tarjeta</Text>
          </Pressable>
        </View>
        <Text style={styles.simulationNote}>
          Simulación académica: la tarjeta demo está aprobada por defecto. Las tarjetas
          terminadas en 0000 se rechazan. Puedes editar los datos o restaurarlos con
          &quot;Usar tarjeta&quot;.
        </Text>
        <TextField
          label="Número de tarjeta"
          value={form.cardNumber}
          onChangeText={(value) => updateField("cardNumber", formatCardNumberInput(value))}
          placeholder="4111 1111 1111 1111"
          keyboardType="number-pad"
          autoComplete="cc-number"
          maxLength={23}
          error={fieldErrors.cardNumber}
        />
        <TextField
          label="Titular de la tarjeta"
          value={form.holderName}
          onChangeText={(value) => updateField("holderName", value)}
          placeholder="Ana Torres"
          autoCapitalize="words"
          autoComplete="name"
          error={fieldErrors.holderName}
        />
        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <TextField
              label="Vencimiento"
              value={form.expiry}
              onChangeText={(value) => updateField("expiry", formatExpiryInput(value))}
              placeholder="MM/AA"
              keyboardType="number-pad"
              autoComplete="cc-exp"
              maxLength={5}
              error={fieldErrors.expiry}
            />
          </View>
          <View style={styles.inlineField}>
            <TextField
              label="CVV"
              value={form.cvv}
              onChangeText={(value) => updateField("cvv", value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              keyboardType="number-pad"
              autoComplete="cc-csc"
              maxLength={4}
              error={fieldErrors.cvv}
            />
          </View>
        </View>

        <PriceSummary
          subtotal={subtotal}
          tax={tax}
          shipping={shipping}
          total={total}
          note={pricingNote}
        />

        {submissionError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>{submissionError}</Text>
            {submissionDetails.map((detail) => (
              <Text key={detail} style={styles.errorDetail}>
                {`• ${detail}`}
              </Text>
            ))}
          </View>
        ) : null}

        <PrimaryButton
          label="Pagar y confirmar"
          loading={isSubmitting}
          onPress={() => {
            void handleSubmit();
          }}
        />
        <Text style={styles.footerNote}>
          Al confirmar aceptas la simulación académica de pago. No se procesan cargos reales.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  simulationNote: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
    padding: spacing.md,
  },
  savedCardBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  savedCardInfo: {
    flex: 1,
    gap: 2,
  },
  savedCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  savedCardValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  savedCardButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  savedCardButtonPressed: {
    opacity: 0.7,
  },
  savedCardButtonLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  invoiceError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  inlineFields: {
    flexDirection: "row",
    gap: spacing.md,
  },
  inlineField: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
  errorDetail: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  confirmationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  confirmationKicker: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  confirmationTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  confirmationMessage: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  confirmationNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
