import { Platform } from "react-native";

export function disableWebTranslation(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.setAttribute("translate", "no");
  root.setAttribute("lang", "es");

  if (document.body) {
    document.body.classList.add("notranslate");
  }

  for (const name of ["google", "robots"]) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement("meta");
      meta.name = name;
      meta.content = "notranslate";
      document.head.appendChild(meta);
    }
  }
}
