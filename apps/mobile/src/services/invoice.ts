import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { buildInvoiceHtml } from "../utils/invoiceHtml";
import type { Order } from "../types";

function printOnWeb(html: string): void {
  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");
  iframe.style.border = "0";
  iframe.style.bottom = "0";
  iframe.style.height = "0";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.width = "0";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    iframe.remove();
    throw new Error("No se pudo preparar la impresión de la factura.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  frameWindow.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
  }, 300);

  frameWindow.addEventListener(
    "afterprint",
    () => {
      iframe.remove();
    },
    { once: true },
  );

  window.setTimeout(() => {
    iframe.remove();
  }, 60000);
}

export async function downloadInvoice(order: Order): Promise<void> {
  const html = buildInvoiceHtml(order);

  if (Platform.OS === "web") {
    printOnWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error("Este dispositivo no permite compartir la factura PDF.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Factura ${order.id}`,
    UTI: "com.adobe.pdf",
  });
}
