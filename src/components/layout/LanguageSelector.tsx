import { Languages } from "lucide-react";
import { languages, tx, useI18n } from "../../i18n";
export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  return (
    <label className="language-selector">
      <Languages size={17} />
      <span className="sr-only">{tx("Ngôn ngữ")}</span>
      <select
        aria-label={tx("Ngôn ngữ")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} aria-label={l.name}>
            {l.short}
          </option>
        ))}
      </select>
    </label>
  );
}
