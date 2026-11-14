import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api, asset, type Obj } from "../api";
import { useStore } from "../context";
import { tx, useI18n } from "../i18n";
import { appBase, runtime } from "../runtime";
function meta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let node = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${name}"]`,
  );
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, name);
    document.head.appendChild(node);
  }
  node.content = content;
}
function link(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
export function Seo() {
  const location = useLocation();
  const { data } = useStore();
  const { locale } = useI18n();
  useEffect(() => {
    let active = true;
    async function update() {
      const path = location.pathname;
      const store = data?.store?.name || "OD. Store";
      const translations = data?.seo?.translations?.[locale] || {};
      const titles: Obj = {
        "/": tx("Phụ kiện công nghệ mỗi ngày"),
        "/products": tx("Tất cả sản phẩm"),
        "/flash-sale": tx("Flash sale"),
        "/blog": tx("Bài viết"),
        "/cart": tx("Giỏ hàng"),
        "/checkout": tx("Đặt hàng"),
        "/lookup": tx("Tra cứu đơn hàng"),
      };
      const privatePage = /^\/(admin|order|cart|checkout|lookup)(\/|$)/.test(
        path,
      );
      let exactTitle = false;
      let title = tx(titles[path] || "Trang không tồn tại");
      let description =
        translations.description ||
        data?.seo?.description ||
        tx(
          "Tai nghe, bàn phím, chuột và loa. Khám phá phụ kiện cho công việc và cuộc sống.",
        );
      let image = data?.seo?.og_image || "";
      let noindex =
        privatePage ||
        !(
          titles[path] ||
          path.startsWith("/product/") ||
          path.startsWith("/blog/")
        );
      let schema: Obj | null = null;
      let alternates: Obj = {};
      let kind = "website";
      if (path === "/") {
        title = translations.title || data?.seo?.site_title || title;
        exactTitle = !!(translations.title || data?.seo?.site_title);
      }
      if (path.startsWith("/admin")) title = tx("Quản trị cửa hàng");
      if (path.startsWith("/order/")) title = tx("Chi tiết đơn hàng");
      if (path.startsWith("/product/")) {
        const product = data?.products?.find(
          (p: Obj) => p.slug === decodeURIComponent(path.slice(9)),
        );
        if (product) {
          title = product.seo_title || product.name;
          exactTitle = !!product.seo_title;
          description =
            product.seo_description || product.description.slice(0, 180);
          image = product.images[0];
          schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description,
            image: product.images.map(asset),
            brand: { "@type": "Brand", name: product.brand },
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "VND",
              availability: product.variants.some((v: Obj) => v.stock > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          };
        }
      }
      if (path.startsWith("/blog/")) {
        try {
          const post = await api(
            "blog/" + decodeURIComponent(path.slice(6)) + "?locale=" + locale,
          );
          title = post.seo_title || post.title;
          exactTitle = !!post.seo_title;
          description = post.seo_description || post.excerpt;
          image = post.cover_image;
          noindex = !!post.noindex;
          kind = "article";
          alternates = Object.fromEntries(
            post.translations.map((p: Obj) => [
              p.locale,
              appBase.replace(/\/$/, "") +
                (p.locale === "en" ? "" : "/" + p.locale) +
                "/blog/" +
                encodeURIComponent(p.slug),
            ]),
          );
          schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            datePublished: post.published_at.replace(" ", "T") + "+07:00",
            dateModified: post.updated_at.replace(" ", "T") + "+07:00",
            author: { "@type": "Person", name: post.author_name },
            inLanguage: locale,
          };
        } catch {
          noindex = true;
        }
      }
      if (!active) return;
      document.title = exactTitle ? title : title + " | " + store;
      meta("description", description);
      meta(
        "robots",
        noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
      );
      const canonical = new URL(
        runtime.routerBase +
          (path === "/" ? (locale === "en" ? "/" : "") : path),
        locationOrigin(),
      ).href;
      link("canonical", canonical);
      for (const [name, value] of Object.entries({
        "og:title": document.title,
        "og:description": description,
        "og:type": kind,
        "og:url": canonical,
        "og:image": image ? new URL(asset(image), locationOrigin()).href : "",
        "og:locale": { en: "en_US", vi: "vi_VN", ko: "ko_KR", zh: "zh_CN" }[
          locale
        ],
      }))
        meta(name, String(value), true);
      meta("twitter:card", "summary_large_image");
      document
        .querySelectorAll("script[data-seo-schema]")
        .forEach((n) => n.remove());
      if (schema) {
        const n = document.createElement("script");
        n.type = "application/ld+json";
        n.dataset.seoSchema = "";
        n.textContent = JSON.stringify(schema);
        document.head.appendChild(n);
      }
      document
        .querySelectorAll("link[rel=alternate][hreflang]")
        .forEach((n) => n.remove());
      if (!noindex) {
        if (!Object.keys(alternates).length)
          alternates = Object.fromEntries(
            ["en", "vi", "ko", "zh"].map((l) => [
              l,
              appBase.replace(/\/$/, "") +
                (l === "en" ? "" : "/" + l) +
                (path === "/" ? "" : path),
            ]),
          );
        for (const [l, url] of Object.entries(alternates)) {
          const el = document.createElement("link");
          el.rel = "alternate";
          el.hreflang = l;
          el.href = new URL(String(url), locationOrigin()).href;
          document.head.appendChild(el);
        }
        if (alternates.en) {
          const el = document.createElement("link");
          el.rel = "alternate";
          el.hreflang = "x-default";
          el.href = new URL(alternates.en, locationOrigin()).href;
          document.head.appendChild(el);
        }
      }
    }
    update();
    return () => {
      active = false;
    };
  }, [location.pathname, data, locale]);
  return null;
}
function locationOrigin() {
  return window.location.origin;
}
