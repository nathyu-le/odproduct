import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { asset, type Obj } from "../../api";
import { ContentLink } from "../../components/ContentLink";
import { useStore } from "../../context";
import { localized, tx } from "../../i18n";
export function BannerCarousel() {
  const { data } = useStore();
  const appearance = data?.appearance || {};
  const banners = (appearance.banners || [])
    .filter((b: Obj) => b.enabled)
    .map((b: Obj) => localized(b));
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [hover, setHover] = useState(false),
    [focused, setFocused] = useState(false),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const active = index % Math.max(banners.length, 1),
    banner = banners[active];
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(mq.matches);
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (
      !appearance.autoplay ||
      paused ||
      hover ||
      focused ||
      reduced ||
      banners.length < 2
    )
      return;
    const t = setInterval(
      () => setIndex((i) => i + 1),
      Number(appearance.interval || 7) * 1000,
    );
    return () => clearInterval(t);
  }, [
    appearance.autoplay,
    appearance.interval,
    paused,
    hover,
    focused,
    reduced,
    banners.length,
  ]);
  if (!banner)
    return (
      <div className="banner-empty">
        <h1>{data?.store?.name || "OD. Store"}</h1>
        <p>{tx("Phụ kiện công nghệ cho mỗi ngày.")}</p>
      </div>
    );
  return (
    <section
      className={"home-banners theme-" + banner.theme}
      aria-label={tx("Bộ sưu tập nổi bật")}
      aria-roledescription="carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setFocused(false);
      }}
    >
      <div
        className="banner-slide"
        aria-label={`${active + 1} / ${banners.length}`}
        aria-roledescription="slide"
      >
        <picture>
          {banner.mobile_image && (
            <source
              media="(max-width:600px)"
              srcSet={asset(banner.mobile_image)}
            />
          )}
          <img
            key={banner.image}
            src={asset(banner.image)}
            alt={banner.alt}
            fetchPriority="high"
          />
        </picture>
        <div className="banner-shade" />
        <div className="banner-copy">
          <span className="banner-eyebrow">{banner.eyebrow}</span>
          <h1>{banner.title}</h1>
          {banner.caption && <p>{banner.caption}</p>}
          {banner.link && (
            <ContentLink href={banner.link} className="banner-cta">
              {banner.button || tx("Khám phá")}
              <ArrowUpRight size={19} />
            </ContentLink>
          )}
        </div>
      </div>
      <div className="banner-controls">
        <div
          className="banner-tabs"
          role="group"
          aria-label={tx("Chọn banner")}
        >
          {banners.map((b: Obj, i: number) => (
            <button
              key={b.id}
              className={active === i ? "active" : ""}
              aria-pressed={active === i}
              onClick={() => {
                setIndex(i);
                setPaused(true);
              }}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>{b.eyebrow || b.title}</span>
            </button>
          ))}
        </div>
        <div className="banner-arrows">
          {appearance.autoplay && !reduced && (
            <button
              aria-label={paused ? tx("Chạy banner") : tx("Tạm dừng banner")}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
          )}
          <button
            disabled={banners.length < 2}
            aria-label={tx("Banner trước")}
            onClick={() => {
              setIndex((i) => (i + banners.length - 1) % banners.length);
              setPaused(true);
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            disabled={banners.length < 2}
            aria-label={tx("Banner tiếp")}
            onClick={() => {
              setIndex((i) => i + 1);
              setPaused(true);
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
