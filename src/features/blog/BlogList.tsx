import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, asset, date, type Obj } from "../../api";
import { tx, useI18n } from "../../i18n";
import { ErrorBox, Loading } from "../../ui";
export function BlogList() {
  const { locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<Obj | null>(null),
    [error, setError] = useState("");
  const q = params.get("q") || "",
    page = Math.max(1, Number(params.get("page")) || 1);
  useEffect(() => {
    let active = true;
    setError("");
    api("blog?" + new URLSearchParams({ locale, q, page: String(page) }))
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [q, page, locale]);
  return (
    <div className="container journal-page">
      <header className="journal-heading">
        <div>
          <p className="cx-eyebrow">OD. JOURNAL</p>
          <h1>{tx("Góc công nghệ & cuộc sống.")}</h1>
          <p>{tx("Hướng dẫn, ý tưởng và những điều đáng đọc.")}</p>
        </div>
        <form
          className="journal-search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = (
              e.currentTarget.elements.namedItem("q") as HTMLInputElement
            ).value;
            setParams(value ? { q: value } : {});
          }}
        >
          <Search size={18} />
          <input
            key={q}
            name="q"
            aria-label={tx("Tìm bài viết")}
            placeholder={tx("Tìm bài viết…")}
            defaultValue={q}
          />
          <button aria-label={tx("Tìm kiếm")}>
            <ArrowUpRight size={19} />
          </button>
        </form>
      </header>
      <ErrorBox>{error}</ErrorBox>
      {data ? (
        <>
          <div className="journal-grid">
            {data.items.map((p: Obj) => (
              <article className="journal-card" key={p.id}>
                <Link
                  className="journal-card-image"
                  to={"/blog/" + encodeURIComponent(p.slug)}
                >
                  {p.cover_image ? (
                    <img
                      src={asset(p.cover_image)}
                      alt={p.cover_alt || p.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="journal-no-image">
                      <FileText size={35} />
                      <span>OD. JOURNAL</span>
                    </div>
                  )}
                </Link>
                <div className="journal-card-meta">
                  <span>{p.locale.toUpperCase()}</span>
                  <time dateTime={p.published_at?.replace(" ", "T") + "+07:00"}>
                    {date(p.published_at)}
                  </time>
                </div>
                <h2>
                  <Link to={"/blog/" + encodeURIComponent(p.slug)}>
                    {p.title}
                  </Link>
                </h2>
                <p>{p.excerpt}</p>
                <Link
                  className="cx-text-link"
                  to={"/blog/" + encodeURIComponent(p.slug)}
                >
                  {tx("Đọc bài viết")}
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            ))}
          </div>
          {!data.items.length && (
            <div className="journal-empty">
              <FileText size={36} />
              <h2>
                {q
                  ? tx("Không tìm thấy bài viết")
                  : tx("Bài viết mới sắp được đăng")}
              </h2>
              <p>
                {q
                  ? tx("Thử một từ khoá khác.")
                  : tx(
                      "Khám phá sản phẩm trong khi chờ những nội dung mới từ cửa hàng.",
                    )}
              </p>
              <Link className="cx-button" to={q ? "/blog" : "/products"}>
                {q ? tx("Tất cả bài viết") : tx("Khám phá sản phẩm")}
              </Link>
            </div>
          )}
          {data.pages > 1 && (
            <nav
              className="blog-pagination"
              aria-label={tx("Phân trang bài viết")}
            >
              <span>{tx("Trang {0} / {1}", [page, data.pages])}</span>
              <button
                aria-label={tx("Trang trước")}
                disabled={page <= 1}
                onClick={() =>
                  setParams({
                    ...Object.fromEntries(params),
                    page: String(page - 1),
                  })
                }
              >
                <ChevronLeft size={19} />
              </button>
              <button
                aria-label={tx("Trang tiếp")}
                disabled={page >= data.pages}
                onClick={() =>
                  setParams({
                    ...Object.fromEntries(params),
                    page: String(page + 1),
                  })
                }
              >
                <ChevronRight size={19} />
              </button>
            </nav>
          )}
        </>
      ) : (
        !error && <Loading />
      )}
    </div>
  );
}
