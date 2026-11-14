import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { appBase, isAdmin, runtime } from "../runtime";
export type Locale = "en" | "vi" | "ko" | "zh";
export const languages: { code: Locale; name: string; short: string }[] = [
  { code: "en", name: "English", short: "EN" },
  { code: "vi", name: "Tiếng Việt", short: "VI" },
  { code: "ko", name: "한국어", short: "KO" },
  { code: "zh", name: "简体中文", short: "中文" },
];
const dictionaries: Record<string, Record<string, string>> = {};
let language: Locale = isAdmin()
  ? (localStorage.getItem("od.admin.locale") as Locale) || "vi"
  : (runtime.locale as Locale);
if (!languages.some((l) => l.code === language))
  language = isAdmin() ? "vi" : "en";
export const currentLocale = () => language;
export async function loadTranslations() {
  const loaders = {
    en: () => import("./locales/en.json"),
    vi: () => import("./locales/vi.json"),
    ko: () => import("./locales/ko.json"),
    zh: () => import("./locales/zh.json"),
  };
  dictionaries[language] = (await loaders[language]()).default;
}

export function tx(key: string, values: unknown[] = []): string {
  const normalized = key.trim();
  const text = dictionaries[language]?.[normalized] || normalized;
  return (
    (key.match(/^\s*/)?.[0] || "") +
    text.replace(/\{(\d+)\}/g, (m, n) =>
      values[Number(n)] == null ? m : String(values[Number(n)]),
    ) +
    (key.match(/\s*$/)?.[0] || "")
  );
}
const Context = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: language, setLocale: () => {} });
export const useI18n = () => useContext(Context);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, set] = useState(language);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function setLocale(next: Locale) {
    if (isAdmin()) {
      localStorage.setItem("od.admin.locale", next);
      location.reload();
      return;
    }
    localStorage.setItem("od.store.locale", next);
    const prefix = next === "en" ? "" : "/" + next;
    const relative = location.pathname.slice(runtime.routerBase.length) || "/";
    const alternate = runtime.alternates[next];
    if (relative.startsWith("/blog/") && alternate) {
      location.assign(alternate);
      return;
    }
    const path = relative.startsWith("/blog/") ? "/blog" : relative;
    location.assign(
      appBase.replace(/\/$/, "") +
        prefix +
        (path === "/" ? "" : path) +
        location.search,
    );
  }
  return (
    <Context.Provider value={{ locale, setLocale }}>
      {children}
    </Context.Provider>
  );
}
export function localized<T extends Record<string, any>>(
  value: T,
  locale = language,
): T {
  const tr = value?.translations?.[locale] || {};
  const copy: Record<string, any> = { ...value };
  for (const key in tr)
    if (typeof tr[key] === "string" && tr[key]) copy[key] = tr[key];
  if (copy.name && !tr.name) copy.name = tx(copy.name);
  if (copy.description && !tr.description)
    copy.description = tx(copy.description);
  if (copy.category) copy.category = tx(copy.category);
  if (copy.variants)
    copy.variants = copy.variants.map((v: Record<string, any>) => ({
      ...v,
      name: tx(v.name),
    }));
  return copy as T;
}
