import { useEffect, useState } from "react";
import { api, type Obj } from "../../api";
import { ImagePicker } from "../../components/ImagePicker";
import { languages, tx, type Locale } from "../../i18n";
import { appBase } from "../../runtime";
import { Button, ErrorBox, Field, Loading, Success } from "../../ui";
export function SeoSettings() {
  const [form, setForm] = useState<Obj | null>(null),
    [locale, setLocale] = useState<Locale>("en"),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("admin/seo")
      .then((d) =>
        setForm({
          site_title: "",
          description: "",
          og_image: "",
          translations: {},
          ...d,
        }),
      )
      .catch((e) => setError(e.message));
  }, []);
  if (!form)
    return (
      <>
        <ErrorBox>{error}</ErrorBox>
        <Loading />
      </>
    );
  const value = form.translations?.[locale] || {};
  const edit = (k: string, v: string) =>
    setForm({
      ...form,
      translations: { ...form.translations, [locale]: { ...value, [k]: v } },
    });
  return (
    <form
      className="panel settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api("admin/seo", form);
          setSuccess(true);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>SEO website</h2>
      <p>
        {tx(
          "Title và description riêng theo ngôn ngữ. Bài viết và sản phẩm có trường SEO riêng; URL, canonical, Open Graph và sitemap được tạo tự động.",
        )}
      </p>
      <div className="content-locale-tabs">
        {languages.map((l) => (
          <button
            type="button"
            key={l.code}
            className={locale === l.code ? "active" : ""}
            aria-pressed={locale === l.code}
            onClick={() => setLocale(l.code)}
          >
            {l.name}
          </button>
        ))}
      </div>
      <Field label={tx("SEO title trang chủ")}>
        <input
          maxLength={100}
          value={value.title || ""}
          onChange={(e) => edit("title", e.target.value)}
        />
        <small>
          {(value.title || "").length}
          {tx(" / 60 ký tự khuyến nghị")}
        </small>
      </Field>
      <Field label={tx("Meta description trang chủ")}>
        <textarea
          rows={3}
          maxLength={320}
          value={value.description || ""}
          onChange={(e) => edit("description", e.target.value)}
        />
        <small>
          {(value.description || "").length}
          {tx(" / 160 ký tự khuyến nghị")}
        </small>
      </Field>
      <ImagePicker
        label={tx("Ảnh chia sẻ mặc định (Open Graph)")}
        optional
        value={form.og_image}
        onChange={(v) => setForm({ ...form, og_image: v })}
      />
      <p>
        <a href={appBase + "sitemap.xml"} target="_blank" rel="noreferrer">
          {tx("Mở sitemap.xml ↗")}
        </a>{" "}
        ·{" "}
        <a href={appBase + "robots.txt"} target="_blank" rel="noreferrer">
          {tx("Mở robots.txt ↗")}
        </a>
      </p>
      <ErrorBox>{error}</ErrorBox>
      {success && <Success>{tx("Đã lưu cấu hình SEO.")}</Success>}
      <Button disabled={busy}>{busy ? tx("Đang lưu…") : tx("Lưu SEO")}</Button>
    </form>
  );
}
