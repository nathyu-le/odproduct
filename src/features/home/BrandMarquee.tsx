import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { asset, type Obj } from "../../api";
import { ContentLink } from "../../components/ContentLink";
import { useStore } from "../../context";
import { tx, useI18n } from "../../i18n";
export function BrandMarquee() {
  const { data } = useStore();
  const { locale } = useI18n();
  const [paused, setPaused] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(1240);
  const appearance = data?.appearance;
  const brands = (appearance?.brands || []).filter((b: Obj) => b.enabled);
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const measure = () => setTrackWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [brands.length]);
  if (!appearance?.brands_enabled || !brands.length) return null;
  const title =
    appearance.brands_translations?.[locale] ||
    appearance.brands_title ||
    tx("BRANDS");
  return (
    <section
      className={
        "brand-marquee" +
        (paused ? " is-paused" : "") +
        (brands.length === 1 ? " is-single" : "")
      }
      aria-label={title}
    >
      <div className="brand-heading">
        <h2>{title}</h2>
        <button
          onClick={() => setPaused(!paused)}
          aria-label={paused ? tx("Chạy logo") : tx("Tạm dừng logo")}
          aria-pressed={paused}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          <span>{paused ? tx("Tiếp tục") : tx("Tạm dừng")}</span>
        </button>
      </div>
      <div className="brand-window">
        <div
          className="brand-track"
          style={{
            animationDuration: `${Math.max(10, trackWidth / Number(appearance.brands_speed || 35))}s`,
          }}
        >
          {[false, true].map((duplicate) => (
            <div
              className="brand-group"
              ref={duplicate ? undefined : group}
              aria-hidden={duplicate || undefined}
              key={String(duplicate)}
            >
              {brands.map((b: Obj, i: number) =>
                b.link ? (
                  <ContentLink
                    key={i}
                    href={b.link}
                    className="brand-logo"
                    tabIndex={duplicate ? -1 : 0}
                  >
                    <img
                      src={asset(b.image)}
                      alt={duplicate ? "" : b.name}
                      loading="lazy"
                    />
                  </ContentLink>
                ) : (
                  <div className="brand-logo" key={i}>
                    <img
                      src={asset(b.image)}
                      alt={duplicate ? "" : b.name}
                      loading="lazy"
                    />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
