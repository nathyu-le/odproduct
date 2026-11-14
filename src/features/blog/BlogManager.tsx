import { postSlug } from "./slug";
import {
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api, asset, date, type Obj } from "../../api";
import { ImagePicker } from "../../components/ImagePicker";
import { languages, type Locale, tx } from "../../i18n";
import { appBase } from "../../runtime";
import { Button, ErrorBox, Field, Loading, Modal } from "../../ui";
const RichTextEditor = lazy(() =>
  import("./RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
);
export function BlogManager() {
  return (
    <Routes>
      <Route index element={<Posts />} />
      <Route path="new" element={<PostEditor />} />
      <Route path=":id" element={<PostEditor />} />
    </Routes>
  );
}
function Posts() {
  const [data, setData] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [locale, setLocale] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [archive, setArchive] = useState<Obj | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api(
        "admin/blog?" +
          new URLSearchParams({ q, locale, status, page: String(page) }),
      )
        .then((d) => active && setData(d))
        .catch((e) => active && setError(e.message));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, locale, status, page, tick]);
  return (
    <div className="blog-manager">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tx("NỘI DUNG / SEO")}</p>
          <h1>{tx("Bài viết")}</h1>
          <p>
            {tx(
              "Viết, nhập Word, lên lịch và quản lý nội dung cho từng ngôn ngữ.",
            )}
          </p>
        </div>
        <Link className="button dark" to="/admin/blog/new">
          <Plus size={17} />
          {tx("Viết bài mới")}
        </Link>
      </div>
      <div className="panel blog-filters">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label={tx("Tìm bài viết")}
            placeholder={tx("Tìm tiêu đề bài viết…")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label={tx("Lọc ngôn ngữ")}
          value={locale}
          onChange={(e) => {
            setLocale(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{tx("Tất cả ngôn ngữ")}</option>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          aria-label={tx("Lọc trạng thái")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{tx("Tất cả trạng thái")}</option>
          <option value="draft">{tx("Bản nháp")}</option>
          <option value="published">{tx("Đã xuất bản / hẹn giờ")}</option>
          <option value="archived">{tx("Lưu trữ")}</option>
        </select>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {data ? (
        <>
          <div className="panel posts-table-wrap">
            <table className="posts-table">
              <thead>
                <tr>
                  <th>{tx("Tiêu đề")}</th>
                  <th>{tx("Ngôn ngữ")}</th>
                  <th>{tx("Trạng thái")}</th>
                  <th>{tx("Cập nhật")}</th>
                  <th>{tx("Thao tác")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p: Obj) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={"/admin/blog/" + p.id}>{p.title}</Link>
                      <small>/blog/{p.slug}</small>
                    </td>
                    <td>{languages.find((l) => l.code === p.locale)?.name}</td>
                    <td>
                      <span className={"post-status " + p.status}>
                        {p.status === "draft"
                          ? tx("Bản nháp")
                          : p.status === "archived"
                            ? tx("Lưu trữ")
                            : new Date(
                                  p.published_at.replace(" ", "T") + "+07:00",
                                ) > new Date()
                              ? tx("Đã hẹn giờ")
                              : tx("Đã xuất bản")}
                      </span>
                    </td>
                    <td>{date(p.updated_at)}</td>
                    <td>
                      <Link
                        className="button outline"
                        to={"/admin/blog/" + p.id}
                      >
                        {tx("Chỉnh sửa")}
                      </Link>
                      {p.status !== "archived" && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={tx("Lưu trữ bài viết")}
                          onClick={() => setArchive(p)}
                        >
                          <Archive size={17} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.items.length && (
              <div className="content-empty">
                <FileText size={28} />
                <h2>{tx("Chưa có bài viết")}</h2>
                <p>{tx("Tạo bản nháp đầu tiên hoặc thay đổi bộ lọc.")}</p>
              </div>
            )}
          </div>
          <div className="blog-pagination">
            <span>
              {data.total}
              {tx(" bài viết · Trang ")}
              {page} / {Math.max(data.pages, 1)}
            </span>
            <button
              aria-label={tx("Trang trước")}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              aria-label={tx("Trang tiếp")}
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </>
      ) : (
        <Loading />
      )}
      {archive && (
        <Modal title={tx("Lưu trữ bài viết?")} onClose={() => setArchive(null)}>
          <p>{archive.title}</p>
          <p>
            {tx(
              "Bài viết sẽ ngừng hiển thị công khai. Bạn có thể mở lại và xuất bản sau.",
            )}
          </p>
          <ErrorBox>{error}</ErrorBox>
          <Button
            onClick={async () => {
              try {
                await api("admin/blog/" + archive.id, { action: "archive" });
                setArchive(null);
                setTick((t) => t + 1);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            {tx("Lưu trữ bài viết")}
          </Button>
        </Modal>
      )}
    </div>
  );
}
const emptyPost = (): Obj => ({
  title: "",
  slug: "",
  locale: "en",
  excerpt: "",
  content: "",
  cover_image: "",
  cover_alt: "",
  seo_title: "",
  seo_description: "",
  status: "draft",
  noindex: false,
  published_at: "",
  translation_group: "",
});
function PostEditor() {
  const { id } = useParams();
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState<Obj | null>(id ? null : emptyPost()),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pendingUploads, setPendingUploads] = useState(0),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false),
    [saved, setSaved] = useState(""),
    [recover, setRecover] = useState<Obj | null>(null),
    [translateTo, setTranslateTo] = useState<Locale>("vi");
  const draftKey = "od.blog.draft." + (id || "new");
  const uploading = pendingUploads > 0;
  const trackUpload = (value: boolean) =>
    setPendingUploads((n) => Math.max(0, n + (value ? 1 : -1)));
  useEffect(() => {
    let alive = true;
    if (id)
      api("admin/blog/" + id)
        .then((d) => alive && setForm(d))
        .catch((e) => setError(e.message));
    else setForm(routeLocation.state?.newPost || emptyPost());
    try {
      const local = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (local && !routeLocation.state?.newPost) setRecover(local);
    } catch {}
    setDirty(false);
    return () => {
      alive = false;
    };
  }, [id]);
  useEffect(() => {
    if (!dirty || !form) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
        setSaved(tx("Bản nháp đang được giữ trên trình duyệt."));
      } catch {
        setSaved(tx("Chưa lưu. Hãy bấm Lưu bài viết."));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, dirty, draftKey]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  const edit = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSaved("");
  };
  if (!form)
    return (
      <>
        <ErrorBox>{error}</ErrorBox>
        <Loading />
      </>
    );
  const selectedTranslationLocale = translateTo === form.locale
    ? (languages.find((language) => language.code !== form.locale)?.code || "en")
    : translateTo;
  const publicUrl =
    appBase.replace(/\/$/, "") +
    (form.locale === "en" ? "" : "/" + form.locale) +
    "/blog/" +
    encodeURIComponent(form.slug);
  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await api("admin/blog", form!);
      setForm(result);
      setDirty(false);
      setSaved(tx("Đã lưu bài viết vào database."));
      localStorage.removeItem(draftKey);
      if (!id) navigate("/admin/blog/" + result.id, { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="post-editor">
      <div className="post-editor-heading">
        <div>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              if (!dirty || confirm(tx("Bạn có thay đổi chưa lưu. Rời trang?")))
                navigate("/admin/blog");
            }}
          >
            <ArrowLeft size={16} />
            {tx("Danh sách bài viết")}
          </button>
          <h1>{id ? tx("Chỉnh sửa bài viết") : tx("Bài viết mới")}</h1>
          <p className="post-save-state" role="status">
            {saved ||
              (dirty
                ? tx("Có thay đổi chưa lưu")
                : tx("Soạn nội dung rồi lưu bản nháp hoặc xuất bản."))}
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setPreview(true)}
          >
            <Eye size={16} />
            {tx("Xem trước")}
          </Button>
          <Button type="button" disabled={busy || uploading} onClick={save}>
            <Save size={16} />
            {busy ? tx("Đang lưu…") : tx("Lưu bài viết")}
          </Button>
        </div>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {recover && (
        <div className="draft-recovery">
          <p>
            {tx("Có bản nháp chưa lưu trên trình duyệt: ")}
            <strong>{recover.title || tx("Chưa có tiêu đề")}</strong>
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setForm({
                ...recover,
                ...(form?.id ? { id: form.id, version: form.version } : {}),
              });
              setDirty(true);
              setRecover(null);
            }}
          >
            {tx("Khôi phục")}
          </Button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setRecover(null);
            }}
          >
            {tx("Bỏ bản nháp")}
          </button>
        </div>
      )}
      <div className="post-editor-grid">
        <div className="post-editor-main">
          <section className="panel">
            <Field label={tx("Tiêu đề bài viết (H1)")}>
              <input
                className="post-title-input"
                maxLength={200}
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm({
                    ...form,
                    title,
                    slug:
                      !form.slug || form.slug === postSlug(form.title)
                        ? postSlug(title)
                        : form.slug,
                  });
                  setDirty(true);
                }}
                placeholder={tx("Nhập tiêu đề bài viết…")}
              />
            </Field>
            <Field label={tx("Đường dẫn / slug")}>
              <input
                value={form.slug}
                maxLength={180}
                onChange={(e) => edit("slug", e.target.value)}
                placeholder="ten-bai-viet"
              />
              <small>
                {location.origin}
                {publicUrl}
              </small>
            </Field>
            <Field label={tx("Mô tả ngắn")}>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.excerpt}
                onChange={(e) => edit("excerpt", e.target.value)}
                placeholder={tx(
                  "Đoạn giới thiệu hiển thị trong danh sách bài viết…",
                )}
              />
            </Field>
          </section>
          <section className="panel post-content-panel">
            <h2>{tx("Nội dung bài viết")}</h2>
            <p className="muted small">
              {tx(
                "Nhập DOCX để chèn nội dung vào vị trí con trỏ. Heading, danh sách, bảng và ảnh tương thích được giữ lại; bố cục Word quá phức tạp có thể cần chỉnh tay.",
              )}
            </p>
            <Suspense fallback={<Loading />}>
              <RichTextEditor
                onBusy={trackUpload}
                value={form.content}
                onChange={(html) => edit("content", html)}
                onImportTitle={(title) => {
                  if (!form.title) {
                    setForm((f) => ({ ...f, title, slug: postSlug(title) }));
                    setDirty(true);
                  }
                }}
              />
            </Suspense>
          </section>
          <section className="panel post-seo-panel">
            <div className="content-card-heading">
              <h2>{tx("SEO & chia sẻ")}</h2>
              <Globe size={19} />
            </div>
            <Field label="SEO title">
              <input
                maxLength={200}
                value={form.seo_title}
                onChange={(e) => edit("seo_title", e.target.value)}
                placeholder={form.title}
              />
              <small>
                {(form.seo_title || form.title).length}
                {tx(" / 60 ký tự khuyến nghị")}
              </small>
            </Field>
            <Field label="Meta description">
              <textarea
                maxLength={320}
                rows={3}
                value={form.seo_description}
                onChange={(e) => edit("seo_description", e.target.value)}
                placeholder={form.excerpt}
              />
              <small>
                {(form.seo_description || form.excerpt).length}
                {tx(" / 160 ký tự khuyến nghị")}
              </small>
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={!!form.noindex}
                onChange={(e) => edit("noindex", e.target.checked)}
              />
              {tx("Không cho công cụ tìm kiếm lập chỉ mục bài này")}
            </label>
            <div className="search-preview">
              <small>
                {location.origin}
                {publicUrl}
              </small>
              <strong>
                {form.seo_title ||
                  form.title ||
                  tx("Tiêu đề hiển thị trên Google")}
              </strong>
              <p>
                {form.seo_description ||
                  form.excerpt ||
                  tx("Mô tả ngắn giúp người tìm kiếm hiểu nội dung bài viết.")}
              </p>
            </div>
          </section>
        </div>
        <aside className="post-editor-aside">
          <section className="panel">
            <h2>{tx("Xuất bản")}</h2>
            <Field label={tx("Ngôn ngữ bài viết")}>
              <select
                value={form.locale}
                onChange={(e) => edit("locale", e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tx("Trạng thái")}>
              <select
                value={form.status}
                onChange={(e) => edit("status", e.target.value)}
              >
                <option value="draft">{tx("Bản nháp")}</option>
                <option value="published">{tx("Xuất bản / hẹn giờ")}</option>
                <option value="archived">{tx("Lưu trữ")}</option>
              </select>
            </Field>
            <Field label={tx("Ngày xuất bản (giờ Việt Nam)")}>
              <input
                type="datetime-local"
                value={
                  form.published_at
                    ? form.published_at.replace(" ", "T").slice(0, 16)
                    : ""
                }
                onChange={(e) => edit("published_at", e.target.value)}
              />
            </Field>
            <p className="muted small">
              {tx(
                "Để trống để xuất bản ngay. Ngày tương lai sẽ tự hiển thị đúng thời điểm, không cần cron.",
              )}
            </p>
            {form.id && form.status === "published" && (
              <a
                className="text-link"
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                {tx("Mở trang bài viết ↗")}
              </a>
            )}
          </section>
          <section className="panel">
            <h2>{tx("Ảnh đại diện")}</h2>
            <ImagePicker
              label={tx("Ảnh bìa / Open Graph")}
              optional
              value={form.cover_image}
              onChange={(v) => edit("cover_image", v)}
              onBusy={trackUpload}
            />
            <Field label={tx("Mô tả ảnh bìa (ALT)")}>
              <input
                maxLength={250}
                value={form.cover_alt}
                onChange={(e) => edit("cover_alt", e.target.value)}
              />
            </Field>
          </section>
          <section className="panel">
            <h2>{tx("Các bản ngôn ngữ")}</h2>
            <p className="muted small">
              {tx(
                "Mỗi ngôn ngữ có tiêu đề, nội dung và slug riêng. Các bản cùng nhóm được nối bằng hreflang.",
              )}
            </p>
            {(form.translations || [])
              .filter((tr: Obj) => tr.id !== form.id)
              .map((tr: Obj) => (
                <Link
                  className="translation-post-link"
                  key={tr.id}
                  to={"/admin/blog/" + tr.id}
                >
                  {tr.locale.toUpperCase()} · {tr.title}
                </Link>
              ))}
            <Field label={tx("Tạo bản dịch")}>
              <select
                value={selectedTranslationLocale}
                onChange={(e) => setTranslateTo(e.target.value as Locale)}
              >
                {languages
                  .filter((l) => l.code !== form.locale)
                  .map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Button
              variant="outline"
              type="button"
              disabled={
                !form.id ||
                dirty ||
                (form.translations || []).some(
                  (tr: Obj) => tr.locale === selectedTranslationLocale,
                )
              }
              onClick={() => {
                const next = {
                  ...emptyPost(),
                  translation_group: form.translation_group,
                  locale: selectedTranslationLocale,
                  cover_image: form.cover_image,
                  cover_alt: form.cover_alt,
                };
                navigate("/admin/blog/new", { state: { newPost: next } });
              }}
            >
              <Plus size={16} />
              {tx("Tạo bản dịch mới")}
            </Button>
            {dirty && (
              <small>{tx("Lưu bài hiện tại trước khi tạo bản dịch.")}</small>
            )}
          </section>
        </aside>
      </div>
      {preview && (
        <Modal
          title={tx("Xem trước bài viết")}
          wide
          onClose={() => setPreview(false)}
        >
          <article className="blog-article-preview">
            <h1>{form.title || tx("Chưa có tiêu đề")}</h1>
            <p>{form.excerpt}</p>
            {form.cover_image && (
              <img src={asset(form.cover_image)} alt={form.cover_alt} />
            )}
            <PreviewHtml html={form.content} />
          </article>
        </Modal>
      )}
    </div>
  );
}
function PreviewHtml({ html }: { html: string }) {
  const [safe, setSafe] = useState("");
  useEffect(() => {
    import("dompurify").then((m) => setSafe(m.default.sanitize(html)));
  }, [html]);
  return (
    <div className="blog-prose" dangerouslySetInnerHTML={{ __html: safe }} />
  );
}
