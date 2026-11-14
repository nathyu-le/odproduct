import type { Obj } from "./api";
import { currentLocale } from "./i18n";
import { appBase } from "./runtime";
export const defaultTheme: Record<string, string> = {
  primary: "#313131",
  accent: "#c5f36a",
  background: "#fffefb",
  surface: "#ffffff",
  text: "#272727",
  header: "#ffffff",
  footer: "#f5f5f5",
  flash_background: "#2f2f2f",
  flash_text: "#ffffff",
  flash_accent: "#c5f36a",
  flash_surface: "#ffffff",
  flash_border: "#e3e3e3",
  sale: "#b9402c",
};
export const defaultBranding: Obj = {
  revision: "default",
  logo: "",
  footer_logo: "",
  favicon: "",
  wordmark: "od.",
  logo_alt: "",
  logo_width: 112,
  logo_mobile_width: 88,
  footer_logo_width: 112,
  loading: {
    enabled: true,
    image: "",
    width: 128,
    background: "#ffffff",
    shine: true,
  },
  theme: defaultTheme,
};
export const brandAsset = (path: string, revision = "default") =>
  appBase + path.replace(/^\//, "") + "?brand=" + encodeURIComponent(revision);
export function brandText(b: Obj, key: string) {
  return b.translations?.[currentLocale()]?.[key] || b[key] || "";
}
export function contrastInk(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  return 1.05 / (l + 0.05) > (l + 0.05) / 0.05 ? "#ffffff" : "#000000";
}
export function themeVariables(b: Obj): Record<string, string> {
  const theme: Record<string, string> = { ...defaultTheme, ...b.theme },
    out: Record<string, string> = {};
  for (const [key, color] of Object.entries(theme))
    out["--od-" + key.replaceAll("_", "-")] = color;
  for (const key of [
    "primary",
    "accent",
    "sale",
    "header",
    "footer",
    "flash_surface",
    "surface",
  ])
    out["--od-on-" + key.replaceAll("_", "-")] = contrastInk(theme[key]);
  return out;
}
