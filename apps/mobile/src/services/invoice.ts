import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { buildInvoiceHtml } from "../utils/invoiceHtml";
import type { Order } from "../types";

function printOnWeb(html: string, documentTitle: string): void {
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
  frameDocument.title = documentTitle;

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
    printOnWeb(html, order.id);
    return;
  }

  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64) {
    throw new Error("No se pudo leer el PDF generado para guardarlo.");
  }

  const filename = `${order.id.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  if (Platform.OS === "android") {
    const savedUri = await saveOnAndroid(filename, base64);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: savedUri,
      type: "application/pdf",
      flags: 1,
    });
    return;
  }

  await saveOnIos(filename, base64);
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error("La factura se guardó, pero este dispositivo no permite mostrar archivos PDF.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Factura ${order.id}`,
    UTI: "com.adobe.pdf",
  });
}

async function saveOnAndroid(filename: string, base64: string): Promise<string> {
  const permission =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
      FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download"),
    );

  if (!permission.granted) {
    throw new Error("Debes autorizar una carpeta para guardar la factura PDF.");
  }

  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    filename,
    "application/pdf",
  );
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

async function saveOnIos(filename: string, base64: string): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error("No se encontró el almacenamiento de documentos de la aplicación.");
  }

  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
