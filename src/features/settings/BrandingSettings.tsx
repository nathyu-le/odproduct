import {
  Eye,
  ImageIcon,
  Palette,
  Save,
  Search,
  Sparkles,
  Type,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { api, asset, money, type Obj } from "../../api";
import {
  brandAsset,
  contrastInk,
  defaultTheme,
  themeVariables,
} from "../../branding";
import { ColorPicker } from "../../components/ColorPicker";
import { ImagePicker } from "../../components/ImagePicker";
import { useStore } from "../../context";
import { languages, tx, type Locale } from "../../i18n";
import { Button, ErrorBox, Field, Loading, Modal, Success } from "../../ui";

export function BrandingSettings() {
  const { data, refresh } = useStore();
  const [form, setForm] = useState<Obj | null>(null);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [busy, setBusy] = useState(false),
    [uploads, setUploads] = useState(0),
    [dirty, setDirty] = useState(false);
  const [section, setSection] = useState("logos"),
    [locale, setLocale] = useState<Locale>("en"),
    [preview, setPreview] = useState(false);
  useEffect(() => {
    api("admin/branding")
      .then(setForm)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const trackUpload = (on: boolean) =>
    setUploads((n) => Math.max(0, n + (on ? 1 : -1)));
  const change = (key: string, value: any) => {
    setDirty(true);
    setSuccess(false);
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };
  const nested = (group: string, key: string, value: any) => {
    setDirty(true);
    setSuccess(false);
    setForm((f) => (f ? { ...f, [group]: { ...f[group], [key]: value } } : f));
  };
  if (!form)
    return error ? (
      <>
        <ErrorBox>{error}</ErrorBox>
        <Button
          type="button"
          variant="outline"
          onClick={() => location.reload()}
        >
          {tx("Thử lại")}
        </Button>
      </>
    ) : (
      <Loading />
    );
  const f = form;
  const image = (key: string, label: string) => (
    <ImagePicker
      label={label}
      optional
      value={f[key] || ""}
      onChange={(v) => change(key, v)}
      onBusy={trackUpload}
    />
  );
  const size = (key: string, label: string, max = 240) => (
    <Field label={label + " (px)"}>
      <input
        type="number"
        min={32}
        max={max}
        required
        value={f[key]}
        onChange={(e) => change(key, Number(e.target.value))}
      />
    </Field>
  );
  const loadingImage = f.loading.image || f.logo || "images/od-logo.svg";
  const loadingWordmark = !f.loading.image && !f.logo && f.wordmark !== "od.";
  const loadingDemo = (
    <div
      className="branding-loading-demo"
      style={
        {
          background: f.loading.background,
          color: contrastInk(f.loading.background),
          "--od-loading-width": f.loading.width + "px",
          "--od-loading-mobile-width": f.loading.width * 0.875 + "px",
        } as CSSProperties
      }
      data-shine={String(f.loading.shine)}
    >
      {f.loading.enabled ? (
        <div
          className={"od-splash-mark" + (loadingWordmark ? " is-wordmark" : "")}
        >
          {loadingWordmark ? (
            <span className="od-splash-wordmark">{f.wordmark}</span>
          ) : (
            <img
              src={asset(loadingImage)}
              alt={f.logo_alt || data?.store?.name || f.wordmark}
            />
          )}
        </div>
      ) : (
        <span>{tx("Loading đang tắt")}</span>
      )}
    </div>
  );
  const colorGroups = [
    [
      tx("Màu sắc website"),
      [
        ["primary", tx("Màu chính / nút mua hàng")],
        ["accent", tx("Màu nhấn")],
        ["background", tx("Nền website")],
        ["surface", tx("Nền card và biểu mẫu")],
        ["text", tx("Chữ nội dung")],
        ["header", tx("Nền header")],
        ["footer", tx("Nền footer")],
      ],
    ],
    [
      tx("Màu flash sale"),
      [
        ["flash_background", tx("Nền tiêu đề flash sale")],
        ["flash_text", tx("Chữ tiêu đề flash sale")],
        ["flash_accent", tx("Điểm nhấn flash sale")],
        ["flash_surface", tx("Nền khung sản phẩm sale")],
        ["flash_border", tx("Viền khung flash sale")],
        ["sale", tx("Nhãn giảm giá / giá sale")],
      ],
    ],
  ] as [string, string[][]][];
  const values = locale === "en" ? f : f.translations?.[locale] || {};
  return (
    <form
      className="content-settings branding-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSuccess(false);
        try {
          const saved = await api("admin/branding", f);
          setForm(saved);
          setDirty(false);
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
          <h2>{tx("Thiết kế cửa hàng")}</h2>
          <p>
            {tx(
              "Logo, loading, màu sắc và nội dung được quản lý tại đây. Xem trước rồi lưu để áp dụng.",
            )}
          </p>
        </div>
        <div className="brand-toolbar-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById("branding-preview")?.scrollIntoView({
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
                block: "start",
              })
            }
          >
            <Eye size={16} />
            {tx("Xem trước trực tiếp")}
          </Button>
          <Button
            type="submit"
            variant="dark"
            disabled={busy || uploads > 0}
            loading={busy}
          >
            <Save size={16} />
            {tx("Lưu giao diện")}
          </Button>
        </div>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {success && (
        <Success>{tx("Đã lưu. Nội dung mới đã có trên cửa hàng.")}</Success>
      )}
      <div
        className="brand-section-tabs"
        role="group"
        aria-label={tx("Chọn phần thiết kế")}
      >
        {[
          ["logos", tx("Logo & favicon"), ImageIcon],
          ["loading", tx("Loading"), Sparkles],
          ["colors", tx("Màu sắc"), Palette],
          ["content", tx("Nội dung"), Type],
        ].map(([key, label, Icon]: any) => (
          <button
            type="button"
            key={key}
            aria-pressed={section === key}
            onClick={() => setSection(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div className="branding-layout">
        <div className="branding-controls">
          {section === "logos" && (
            <>
              <section className="panel">
                <h3>{tx("Logo cửa hàng")}</h3>
                <p className="muted small">
                  {tx(
                    "Logo chính dùng ở header và trang quản trị. PNG nền trong suốt giúp logo rõ trên nền bạn chọn.",
                  )}
                </p>
                {image("logo", tx("Logo header / admin"))}
                <div className="form-grid">
                  {size("logo_width", tx("Chiều rộng logo desktop"))}
                  {size("logo_mobile_width", tx("Chiều rộng logo mobile"), 160)}
                </div>
                <Field label={tx("Tên hiển thị khi chưa có ảnh logo")}>
                  <input
                    required
                    maxLength={80}
                    value={f.wordmark}
                    onChange={(e) => change("wordmark", e.target.value)}
                  />
                </Field>
                <Field label={tx("Mô tả logo (ALT)")}>
                  <input
                    maxLength={150}
                    placeholder={data?.store?.name}
                    value={f.logo_alt}
                    onChange={(e) => change("logo_alt", e.target.value)}
                  />
                </Field>
              </section>
              <section className="panel">
                <h3>{tx("Logo footer")}</h3>
                <p className="muted small">
                  {tx(
                    "Để trống sẽ dùng logo chính. Có thể dùng bản logo sáng nếu footer có nền tối.",
                  )}
                </p>
                {image("footer_logo", tx("Ảnh logo footer"))}
                {size("footer_logo_width", tx("Chiều rộng logo footer"))}
              </section>
              <section className="panel">
                <h3>{tx("Favicon / biểu tượng tab")}</h3>
                <p className="muted small">
                  {tx(
                    "Nên dùng PNG vuông 512 × 512px. Biểu tượng này cũng dùng khi thêm website vào màn hình chính.",
                  )}
                </p>
                {image("favicon", tx("Ảnh favicon"))}
              </section>
            </>
          )}
          {section === "loading" && (
            <section className="panel">
              <h3>{tx("Màn hình loading")}</h3>
              <label className="check">
                <input
                  type="checkbox"
                  checked={f.loading.enabled}
                  onChange={(e) =>
                    nested("loading", "enabled", e.target.checked)
                  }
                />
                {tx("Bật loading khi mở trang / F5")}
              </label>
              <p className="muted small">
                {tx(
                  "Để trống ảnh loading sẽ dùng logo chính. Loading tự ẩn khi trang sẵn sàng; không chạy lại khi bấm từng trang.",
                )}
              </p>
              <ImagePicker
                label={tx("Ảnh loading riêng")}
                optional
                value={f.loading.image}
                onChange={(v) => nested("loading", "image", v)}
                onBusy={trackUpload}
              />
              <Field label={tx("Chiều rộng ảnh loading (px)")}>
                <input
                  type="number"
                  min={64}
                  max={240}
                  required
                  value={f.loading.width}
                  onChange={(e) =>
                    nested("loading", "width", Number(e.target.value))
                  }
                />
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={f.loading.shine}
                  onChange={(e) => nested("loading", "shine", e.target.checked)}
                />
                {tx("Hiệu ứng sáng quét qua logo")}
              </label>
              <ColorPicker
                label={tx("Màu nền loading")}
                value={f.loading.background}
                onChange={(v) => nested("loading", "background", v)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreview(true)}
              >
                <Eye size={16} />
                {tx("Xem trước loading")}
              </Button>
            </section>
          )}
          {section === "colors" && (
            <>
              <section className="panel">
                <h3>{tx("Bảng màu HEX / RGB")}</h3>
                <p className="muted small">
                  {tx(
                    "Bấm ô màu để mở bảng chọn đầy đủ, hoặc nhập HEX và RGB. Màu nút được tự chọn chữ sáng/tối để dễ đọc.",
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => change("theme", { ...defaultTheme })}
                >
                  <RotateCcw size={15} />
                  {tx("Khôi phục màu mặc định")}
                </Button>
              </section>
              {colorGroups.map(([title, colors]) => (
                <section className="panel" key={title}>
                  <h3>{title}</h3>
                  <div className="brand-color-grid">
                    {colors.map(([key, label]) => (
                      <ColorPicker
                        key={key}
                        label={label}
                        value={f.theme[key]}
                        onChange={(v) => nested("theme", key, v)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
          {section === "content" && (
            <section className="panel">
              <h3>{tx("Nội dung header / footer")}</h3>
              <label className="check">
                <input
                  type="checkbox"
                  checked={f.announcement_enabled}
                  onChange={(e) =>
                    change("announcement_enabled", e.target.checked)
                  }
                />
                {tx("Hiển thị thanh thông báo đầu trang")}
              </label>
              <div className="content-locale-tabs">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
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
              {[
                ["announcement", tx("Thông báo đầu trang"), 250],
                ["footer_title", tx("Tiêu đề footer"), 300],
                ["footer_description", tx("Giới thiệu footer"), 1000],
              ].map(([key, label, max]: any) => (
                <Field key={key} label={label}>
                  <textarea
                    rows={key === "announcement" ? 2 : 3}
                    maxLength={max}
                    value={values[key] || ""}
                    onChange={(e) => {
                      if (locale === "en") change(key, e.target.value);
                      else {
                        setDirty(true);
                        setSuccess(false);
                        setForm((old) =>
                          old
                            ? {
                                ...old,
                                translations: {
                                  ...old.translations,
                                  [locale]: {
                                    ...old.translations?.[locale],
                                    [key]: e.target.value,
                                  },
                                },
                              }
                            : old,
                        );
                      }
                    }}
                  />
                </Field>
              ))}
            </section>
          )}
        </div>
        <aside className="branding-preview-column" id="branding-preview">
          <div className="panel">
            <h3>{tx("Xem trước trực tiếp")}</h3>
            <p className="muted small">
              {tx("Bản xem trước dùng thay đổi chưa lưu.")}
            </p>
            <div
              className="branding-preview"
              style={themeVariables(f) as CSSProperties}
            >
              {section === "loading" ? (
                loadingDemo
              ) : (
                <>
                  <div className="brand-demo-header">
                    {f.logo ? (
                      <img
                        src={brandAsset(f.logo, f.revision)}
                        alt={f.logo_alt || f.wordmark}
                        style={{ width: Math.min(f.logo_width, 150) }}
                      />
                    ) : (
                      <b>{f.wordmark}</b>
                    )}
                    <Search size={18} />
                  </div>
                  <div className="brand-demo-content">
                    <h4>{data?.store?.name}</h4>
                    <button type="button" className="brand-demo-cta">
                      {tx("Khám phá")}
                    </button>
                    <div className="brand-demo-sale">
                      <div>
                        <Zap size={15} />
                        {tx("Flash sale")}
                      </div>
                      <section>
                        {(data?.products || []).slice(0, 2).map((p: Obj) => (
                          <article key={p.id}>
                            <div className="brand-demo-image">
                              {p.images?.[0] && (
                                <img src={asset(p.images[0])} alt="" />
                              )}
                              <span aria-hidden="true">
                                <Zap size={11} />
                              </span>
                            </div>
                            <p>{p.name}</p>
                            <strong>{money(p.price)}</strong>
                          </article>
                        ))}
                      </section>
                    </div>
                  </div>
                  <div className="brand-demo-footer">
                    {f.footer_logo || f.logo ? (
                      <img
                        src={brandAsset(f.footer_logo || f.logo, f.revision)}
                        alt={f.wordmark}
                      />
                    ) : (
                      <b>{f.wordmark}</b>
                    )}
                    <p>{f.footer_title}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="brand-preview-note">
            {tx(
              "Lưu giao diện để áp dụng cho cửa hàng. Banner và dải thương hiệu nằm ở tab Banner & thương hiệu.",
            )}
          </p>
        </aside>
      </div>
      <div className="content-save-bar">
        <span className="muted small">
          {dirty ? tx("Có thay đổi chưa lưu") : tx("Giao diện đã đồng bộ")}
        </span>
        <Button
          type="submit"
          variant="dark"
          loading={busy}
          disabled={busy || uploads > 0}
        >
          <Save size={16} />
          {tx("Lưu giao diện")}
        </Button>
      </div>
      {preview && (
        <Modal
          title={tx("Xem trước loading")}
          onClose={() => setPreview(false)}
        >
          {loadingDemo}
        </Modal>
      )}
    </form>
  );
}
