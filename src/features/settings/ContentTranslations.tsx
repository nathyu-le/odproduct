import { useState } from "react";
import type { Obj } from "../../api";
import { languages, tx, type Locale } from "../../i18n";
import { Field } from "../../ui";
export function ContentTranslations({
  value = {},
  onChange,
  category = false,
}: {
  value?: Obj;
  onChange: (value: Obj) => void;
  category?: boolean;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const current = value[locale] || {};
  const fields = category
    ? [["name", tx("Tên danh mục")]]
    : [
        ["name", tx("Tên sản phẩm")],
        ["description", tx("Mô tả")],
        ["seo_title", tx("SEO title")],
        ["seo_description", tx("Meta description")],
      ];
  return (
    <details className="product-translations">
      <summary>{tx("Bản dịch & SEO theo ngôn ngữ")}</summary>
      <p className="muted small">
        {tx(
          "Nhập bản dịch riêng. Trường để trống sẽ dùng nội dung gốc; website không tự dịch nội dung bạn mới nhập.",
        )}
      </p>
      <div className="content-locale-tabs">
        {languages.map((l) => (
          <button
            type="button"
            key={l.code}
            className={locale === l.code ? "active" : ""}
            onClick={() => setLocale(l.code)}
          >
            {l.name}
          </button>
        ))}
      </div>
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          {key.includes("description") ? (
            <textarea
              rows={3}
              maxLength={key === "description" ? 20000 : 320}
              value={current[key] || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [locale]: { ...current, [key]: e.target.value },
                })
              }
            />
          ) : (
            <input
              maxLength={200}
              value={current[key] || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [locale]: { ...current, [key]: e.target.value },
                })
              }
            />
          )}
        </Field>
      ))}
    </details>
  );
}
