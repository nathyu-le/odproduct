import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Obj } from "../../api";
import { ImagePicker } from "../../components/ImagePicker";
import { useStore } from "../../context";
import { languages, tx, type Locale } from "../../i18n";
import { Button, ErrorBox, Field, Loading, Success } from "../../ui";
export function ContentSettings() {
  const { refresh } = useStore();
  const [form, setForm] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [busy, setBusy] = useState(false),
    [pendingUploads, setPendingUploads] = useState(0),
    [locale, setLocale] = useState<Locale>("en");
  const uploading = pendingUploads > 0;
  const trackUpload = (value: boolean) =>
    setPendingUploads((n) => Math.max(0, n + (value ? 1 : -1)));
  useEffect(() => {
    api("admin/appearance")
      .then(setForm)
      .catch((e) => setError(e.message));
  }, []);
  if (!form)
    return (
      <>
        <ErrorBox>{error}</ErrorBox>
        <Loading />
      </>
    );
  const change = (key: string, value: any) => {
    setSuccess(false);
    setForm({ ...form, [key]: value });
  };
  const editBanner = (
    i: number,
    key: string,
    value: any,
    translated = false,
  ) => {
    const banners = structuredClone(form.banners);
    const banner = banners[i];
    if (translated && locale !== "en") {
      banner.translations ||= {};
      banner.translations[locale] ||= {};
      banner.translations[locale][key] = value;
    } else banner[key] = value;
    change("banners", banners);
  };
  const editBrand = (i: number, key: string, value: any) =>
    change(
      "brands",
      form.brands.map((b: Obj, n: number) =>
        n === i ? { ...b, [key]: value } : b,
      ),
    );
  const move = (i: number, dir: number) => {
    const rows = [...form.brands];
    [rows[i], rows[i + dir]] = [rows[i + dir], rows[i]];
    change("brands", rows);
  };
  return (
    <form
      className="content-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSuccess(false);
        try {
          await api("admin/appearance", form);
          await refresh();
          setSuccess(true);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="panel content-settings-intro">
        <div>
          <h2>{tx("Banner & thương hiệu")}</h2>
          <p>
            {tx(
              "Ảnh và caption do bạn chọn. Ba banner độc lập; logo thêm bao nhiêu cũng được và chạy dưới flash sale.",
            )}
          </p>
        </div>
        <Button type="submit" disabled={busy || uploading}>
          <Save size={16} />
          {busy ? tx("Đang lưu…") : tx("Lưu giao diện")}
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {success && (
        <Success>{tx("Đã lưu. Nội dung mới đã có trên cửa hàng.")}</Success>
      )}
      <section className="panel">
        <h3>{tx("Nội dung banner theo ngôn ngữ")}</h3>
        <div className="content-locale-tabs">
          {languages.map((l) => (
            <button
              type="button"
              key={l.code}
              aria-pressed={locale === l.code}
              className={locale === l.code ? "active" : ""}
              onClick={() => setLocale(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="muted small">
          {tx(
            "English là nội dung gốc. Bản dịch để trống sẽ dùng nội dung English; không tự dịch tên thương hiệu.",
          )}
        </p>
      </section>
      <div className="banner-settings-grid">
        {form.banners.map((b: Obj, i: number) => {
          const values = locale === "en" ? b : b.translations?.[locale] || {};
          return (
            <section className="panel banner-settings-card" key={b.id || i}>
              <div className="content-card-heading">
                <h3>Banner {i + 1}</h3>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={(e) => editBanner(i, "enabled", e.target.checked)}
                  />
                  {tx("Hiển thị")}
                </label>
              </div>
              <ImagePicker
                label={tx("Ảnh chính")}
                value={b.image}
                onChange={(v) => editBanner(i, "image", v)}
                onBusy={trackUpload}
              />
              <details>
                <summary>{tx("Ảnh riêng cho điện thoại (tuỳ chọn)")}</summary>
                <ImagePicker
                  label={tx("Ảnh điện thoại")}
                  optional
                  value={b.mobile_image || ""}
                  onChange={(v) => editBanner(i, "mobile_image", v)}
                  onBusy={trackUpload}
                />
              </details>
              {[
                ["eyebrow", tx("Nhãn nhỏ")],
                ["title", tx("Tiêu đề banner")],
                ["caption", tx("Caption / mô tả")],
                ["button", tx("Chữ trên nút")],
                ["alt", tx("Mô tả ảnh (ALT)")],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  {key === "caption" || key === "title" ? (
                    <textarea
                      rows={key === "caption" ? 3 : 2}
                      value={values[key] || ""}
                      maxLength={key === "title" ? 200 : 1000}
                      onChange={(e) => editBanner(i, key, e.target.value, true)}
                    />
                  ) : (
                    <input
                      value={values[key] || ""}
                      maxLength={key === "alt" ? 250 : 100}
                      onChange={(e) => editBanner(i, key, e.target.value, true)}
                    />
                  )}
                </Field>
              ))}
              <Field label={tx("Liên kết khi bấm nút")}>
                <input
                  placeholder={tx("/products hoặc https://...")}
                  value={b.link || ""}
                  onChange={(e) => editBanner(i, "link", e.target.value)}
                />
              </Field>
              <Field label={tx("Màu chữ trên ảnh")}>
                <select
                  value={b.theme}
                  onChange={(e) => editBanner(i, "theme", e.target.value)}
                >
                  <option value="dark">{tx("Chữ sáng / nền ảnh tối")}</option>
                  <option value="light">{tx("Chữ tối / nền ảnh sáng")}</option>
                </select>
              </Field>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <h3>{tx("Chuyển banner")}</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={form.autoplay}
            onChange={(e) => change("autoplay", e.target.checked)}
          />
          {tx("Tự động chuyển (tôn trọng chế độ giảm chuyển động)")}
        </label>
        <Field label={tx("Thời gian mỗi banner (giây)")}>
          <input
            type="number"
            min={4}
            max={30}
            value={form.interval}
            onChange={(e) => change("interval", Number(e.target.value))}
          />
        </Field>
      </section>
      <section className="panel">
        <div className="content-card-heading">
          <div>
            <h2>{tx("Dải thương hiệu")}</h2>
            <p>
              {tx(
                "Hiện sau Flash sale, trước “Tìm theo nhu cầu”. Kéo bằng nút lên/xuống để sắp xếp.",
              )}
            </p>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={form.brands_enabled}
              onChange={(e) => change("brands_enabled", e.target.checked)}
            />
            {tx("Hiển thị")}
          </label>
        </div>
        <div className="form-grid">
          <Field label={tx("Tiêu đề dải logo")}>
            <input
              value={
                locale === "en"
                  ? form.brands_title
                  : form.brands_translations?.[locale] || ""
              }
              onChange={(e) =>
                locale === "en"
                  ? change("brands_title", e.target.value)
                  : change("brands_translations", {
                      ...form.brands_translations,
                      [locale]: e.target.value,
                    })
              }
            />
          </Field>
          <Field label={tx("Tốc độ chạy (px/giây)")}>
            <input
              type="number"
              min={10}
              max={120}
              value={form.brands_speed}
              onChange={(e) => change("brands_speed", Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="brand-settings-list">
          {form.brands.map((b: Obj, i: number) => (
            <div className="brand-settings-row" key={b.id}>
              <span className="brand-position">{i + 1}</span>
              <ImagePicker
                label="Logo"
                value={b.image}
                onChange={(v) => editBrand(i, "image", v)}
                onBusy={trackUpload}
              />
              <div>
                <Field label={tx("Tên thương hiệu / ALT")}>
                  <input
                    required
                    maxLength={150}
                    value={b.name}
                    onChange={(e) => editBrand(i, "name", e.target.value)}
                  />
                </Field>
                <Field label={tx("Liên kết (tuỳ chọn)")}>
                  <input
                    value={b.link}
                    onChange={(e) => editBrand(i, "link", e.target.value)}
                  />
                </Field>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={(e) => editBrand(i, "enabled", e.target.checked)}
                  />
                  {tx("Hiển thị logo")}
                </label>
              </div>
              <div className="brand-row-actions">
                <button
                  type="button"
                  aria-label={tx("Đưa logo lên")}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  aria-label={tx("Đưa logo xuống")}
                  disabled={i === form.brands.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  type="button"
                  aria-label={tx("Xoá logo")}
                  onClick={() =>
                    change(
                      "brands",
                      form.brands.filter((_: Obj, n: number) => n !== i),
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!form.brands.length && (
          <p className="content-empty">
            {tx(
              "Chưa có logo. Thêm logo đầu tiên để bật dải thương hiệu trên trang chủ.",
            )}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            change("brands", [
              ...form.brands,
              {
                id: crypto.randomUUID(),
                name: "",
                image: "",
                link: "",
                enabled: true,
              },
            ])
          }
        >
          <Plus size={16} />
          {tx("Thêm thương hiệu")}
        </Button>
      </section>
      <div className="content-save-bar">
        <ErrorBox>{error}</ErrorBox>
        <Button type="submit" disabled={busy || uploading}>
          <Save size={16} />
          {busy ? tx("Đang lưu…") : tx("Lưu tất cả thay đổi")}
        </Button>
      </div>
    </form>
  );
}
