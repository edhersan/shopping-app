import { StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "../utils/format";
import { TAX_RATE } from "../utils/constants";
import { colors, radius, spacing } from "../utils/theme";

interface PriceSummaryProps {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  note?: string;
}

interface RowProps {
  label: string;
  value: string;
  valueStyle?: object;
}

function SummaryRow({ label, value, valueStyle }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

export function PriceSummary({
  subtotal,
  tax,
  shipping,
  total,
  note,
}: PriceSummaryProps) {
  const taxLabel = `Impuesto (${Math.round(TAX_RATE * 100)}%)`;

  return (
    <View style={styles.container}>
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
      <SummaryRow label={taxLabel} value={formatCurrency(tax)} />
      <SummaryRow
        label="Envío"
        value={shipping === 0 ? "Gratis" : formatCurrency(shipping)}
        valueStyle={shipping === 0 ? styles.freeShipping : undefined}
      />
      <View style={styles.divider} />
      <SummaryRow
        label="Total"
        value={formatCurrency(total)}
        valueStyle={styles.totalValue}
      />
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  freeShipping: {
    color: colors.success,
    fontWeight: "700",
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
