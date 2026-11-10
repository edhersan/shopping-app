import { formatCurrency, formatDate } from "./format";
import type { Order } from "../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInvoiceHtml(order: Order): string {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="numeric">${item.quantity}</td>
          <td class="numeric">${formatCurrency(item.unitPrice)}</td>
          <td class="numeric">${formatCurrency(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const totalUnits = order.items.reduce(
    (accumulator, item) => accumulator + item.quantity,
    0,
  );
  const statusLabel = order.status === "paid" ? "Pagado" : "Rechazado";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(order.id)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        margin: 0;
        padding: 32px;
      }
      .header {
        align-items: flex-start;
        border-bottom: 2px solid #0f766e;
        display: flex;
        justify-content: space-between;
        padding-bottom: 18px;
      }
      .brand { color: #0f766e; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
      .tagline { color: #64748b; font-size: 12px; margin-top: 4px; }
      .invoice-title { font-size: 18px; font-weight: 800; text-align: right; }
      .meta { color: #64748b; font-size: 11px; line-height: 1.6; margin-top: 6px; text-align: right; }
      .grid { display: flex; gap: 24px; margin-top: 24px; }
      .block { flex: 1; }
      .block-title {
        color: #64748b;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .block p { margin: 2px 0; line-height: 1.5; }
      table { border-collapse: collapse; margin-top: 24px; width: 100%; }
      th {
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        color: #475569;
        font-size: 10px;
        letter-spacing: 0.06em;
        padding: 10px 12px;
        text-align: left;
        text-transform: uppercase;
      }
      td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; vertical-align: top; }
      .numeric { text-align: right; white-space: nowrap; }
      .totals { margin-left: auto; margin-top: 18px; width: 260px; }
      .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals-row span:last-child { font-weight: 600; }
      .totals-row.total {
        border-top: 1px solid #e2e8f0;
        font-size: 16px;
        font-weight: 800;
        margin-top: 6px;
        padding-top: 10px;
      }
      .totals-row.total span:last-child { font-weight: 800; }
      .footer {
        border-top: 1px solid #e2e8f0;
        color: #64748b;
        font-size: 10px;
        line-height: 1.6;
        margin-top: 32px;
        padding-top: 14px;
      }
      .badge {
        background: #dcfce7;
        border-radius: 999px;
        color: #15803d;
        display: inline-block;
        font-size: 10px;
        font-weight: 800;
        padding: 3px 8px;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">Shopping App</div>
        <div class="tagline">Tienda de demostración · Pagos simulados</div>
      </div>
      <div>
        <div class="invoice-title">Factura / Recibo</div>
        <div class="meta">
          ${escapeHtml(order.id)}<br />
          ${escapeHtml(formatDate(order.createdAt))}
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="block">
        <div class="block-title">Cliente</div>
        <p><strong>${escapeHtml(order.customer.fullName)}</strong></p>
        <p>${escapeHtml(order.customer.email)}</p>
        <p>${escapeHtml(order.customer.address)}</p>
        <p>${escapeHtml(order.customer.city)}, ${escapeHtml(order.customer.zipCode)}</p>
      </div>
      <div class="block">
        <div class="block-title">Pago</div>
        <p><span class="badge">${escapeHtml(statusLabel)}</span></p>
        <p>${escapeHtml(order.payment.brand)} •••• ${escapeHtml(order.payment.last4)}</p>
        <p>${totalUnits} artículo${totalUnits === 1 ? "" : "s"}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="numeric">Cantidad</th>
          <th class="numeric">Precio unitario</th>
          <th class="numeric">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div class="totals-row"><span>Impuesto</span><span>${formatCurrency(order.tax)}</span></div>
      <div class="totals-row"><span>Envío</span><span>${order.shipping === 0 ? "Gratis" : formatCurrency(order.shipping)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
    </div>

    <div class="footer">
      Documento generado automáticamente por Shopping App. Este recibo corresponde a una
      compra de demostración: no se procesaron cargos reales ni se almacenó el número
      completo de la tarjeta.
    </div>
  </body>
</html>`;
}
