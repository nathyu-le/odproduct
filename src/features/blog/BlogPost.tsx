import DOMPurify from "dompurify";
import { ArrowLeft, ArrowUpRight, Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, asset, date, type Obj } from "../../api";
import { tx, useI18n } from "../../i18n";
import { appBase, runtime } from "../../runtime";
import { ErrorBox, Loading } from "../../ui";
export function BlogPost() {
  const { slug } = useParams();
  const { locale } = useI18n();
  const [post, setPost] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    setPost(null);
    setError("");
    api("blog/" + (slug || "") + "?locale=" + locale)
      .then((d) => {
        if (active) {
          setPost(d);
          runtime.alternates = Object.fromEntries(
            d.translations.map((t: Obj) => [
              t.locale,
              appBase.replace(/\/$/, "") +
                (t.locale === "en" ? "" : "/" + t.locale) +
                "/blog/" +
                encodeURIComponent(t.slug),
            ]),
          );
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
      runtime.alternates = {};
    };
  }, [slug, locale]);
  const html = useMemo(
    () => DOMPurify.sanitize(post?.content || ""),
    [post?.content],
  );
  const headings = useMemo(() => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return [...doc.querySelectorAll("h2,h3")].map((h) => ({
      id: h.id,
      title: h.textContent || "",
      sub: h.tagName === "H3",
    }));
  }, [html]);
  return (
    <div className="container journal-post-page">
      <Link className="cx-text-link" to="/blog">
        <ArrowLeft size={17} />
        {tx("Tất cả bài viết")}
      </Link>
      <ErrorBox>{error}</ErrorBox>
      {post ? (
        <>
          <header className="journal-post-heading">
            <p className="cx-eyebrow">OD. JOURNAL</p>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="journal-post-meta">
              <span>{post.author_name}</span>
              <time dateTime={post.published_at.replace(" ", "T") + "+07:00"}>
                {date(post.published_at)}
              </time>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>
                  {copied ? tx("Đã sao chép") : tx("Sao chép liên kết")}
                </span>
              </button>
            </div>
          </header>
          {post.cover_image && (
            <img
              className="journal-post-cover"
              src={asset(post.cover_image)}
              alt={post.cover_alt || post.title}
            />
          )}
          <div className="journal-reading-grid">
            <article
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            {headings.length > 1 && (
              <aside className="journal-toc">
                <p>{tx("Nội dung bài viết")}</p>
                {headings.map((h) => (
                  <button
                    key={h.id}
                    className={h.sub ? "sub" : ""}
                    onClick={() =>
                      document
                        .getElementById(h.id)
                        ?.scrollIntoView({
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                          block: "start",
                        })
                    }
                  >
                    {h.title}
                  </button>
                ))}
              </aside>
            )}
          </div>
          <footer className="journal-post-footer">
            <span>OD. JOURNAL</span>
            <Link to="/products">
              {tx("Khám phá sản phẩm")}
              <ArrowUpRight size={17} />
            </Link>
          </footer>
        </>
      ) : (
        !error && <Loading />
      )}
    </div>
  );
}
