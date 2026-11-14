import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Keyboard,
  Mouse,
  Speaker,
  Cable,
  ShoppingBag,
  Truck,
  Package,
  Zap,
  Image as ImageIcon,
} from "lucide-react";
import { useStore } from "./context";
import { asset, money, date, type Obj } from "./api";
import {
  useNow,
  displayProduct,
  saleState,
  remaining,
  timestamp,
} from "./promotions";
import { Loading } from "./ui";
import { ProductCard } from "./catalogue-product";
const categoryIcons: Obj = {
  headphones: Headphones,
  keyboard: Keyboard,
  mouse: Mouse,
  speaker: Speaker,
  cable: Cable,
};
export function SaleClock({ end, label }: { end: string; label: string }) {
  const time = remaining(end, useNow());
  const cells = [
    ...(time.days > 0 ? [[time.days, "ngày"]] : []),
    [time.hours, "giờ"],
    [time.minutes, "phút"],
    [time.seconds, "giây"],
  ];
  return (
    <div
      className="cx-countdown"
      role="timer"
      aria-live="off"
      aria-label={label}
    >
      <span>{label}</span>
      <div>
        {cells.map(([n, unit]) => (
          <span className="cx-clock-cell" key={unit}>
            <b>{String(n).padStart(2, "0")}</b>
            <small>{unit}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
export function CatalogueSale({
  active,
  upcoming,
}: {
  active: Obj[];
  upcoming: Obj[];
}) {
  const track = useRef<HTMLDivElement>(null);
  const shown = active.length ? active : upcoming;
  const [scroll, setScroll] = useState({ left: true, right: shown.length > 1 });
  const nextEnd = active.length
    ? active.reduce((a, p) =>
        timestamp(p.flash_end) < timestamp(a.flash_end) ? p : a,
      ).flash_end
    : upcoming[0]?.flash_start;
  function measure() {
    const el = track.current;
    if (el)
      setScroll({
        left: el.scrollLeft <= 2,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
  }
  useEffect(() => {
    measure();
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown.length]);
  function move(direction: number) {
    const el = track.current;
    if (el)
      el.scrollBy({
        left: direction * (el.clientWidth * 0.82),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <section className="cx-sale" aria-labelledby="cx-sale-title">
      <div className="cx-sale-head">
        <div className="cx-sale-heading">
          <span className="cx-sale-mark">
            <Zap size={23} />
          </span>
          <div>
            <p>
              {active.length
                ? "Ưu đãi đang diễn ra"
                : upcoming.length
                  ? "Ưu đãi sắp mở"
                  : "Ưu đãi có hẹn"}
            </p>
            <h2 id="cx-sale-title">
              Flash sale<span>.</span>
            </h2>
          </div>
        </div>
        {nextEnd && (
          <SaleClock
            end={nextEnd}
            label={
              active.length
                ? "Ưu đãi gần nhất kết thúc sau"
                : "Phiên tiếp theo bắt đầu sau"
            }
          />
        )}
        <Link className="cx-sale-link" to="/flash-sale">
          Xem tất cả
          <ArrowUpRight size={17} />
        </Link>
      </div>
      {shown.length > 0 ? (
        <div className="cx-sale-body">
          <div className="cx-sale-toolbar">
            <span>
              {active.length
                ? `${active.length} sản phẩm đang ưu đãi`
                : `Mở lúc ${date(upcoming[0].flash_start)}`}
            </span>
            {shown.length > 1 && (
              <div className="cx-rail-buttons">
                <button
                  type="button"
                  disabled={scroll.left}
                  onClick={() => move(-1)}
                  aria-label="Sản phẩm flash sale trước"
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Sản phẩm flash sale tiếp"
                  disabled={!scroll.right}
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            )}
          </div>
          <div
            className="cx-sale-track"
            ref={track}
            onScroll={measure}
            tabIndex={0}
            role="region"
            aria-label="Danh sách flash sale, vuốt ngang để xem thêm"
          >
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <span className="cx-swipe-hint">
            Vuốt hoặc dùng mũi tên để xem thêm sản phẩm
          </span>
        </div>
      ) : (
        <div className="cx-sale-empty">
          <Zap size={28} />
          <div>
            <h3>Phiên mới sẽ xuất hiện tại đây</h3>
            <p>
              Cửa hàng chưa có flash sale đang mở. Bạn vẫn có thể xem toàn bộ
              sản phẩm.
            </p>
          </div>
          <Link to="/products">
            Xem sản phẩm
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}
export function CatalogueHome() {
  const { data } = useStore();
  const now = useNow();
  const [heroIndex, setHeroIndex] = useState(0);
  if (!data) return <Loading />;
  const products = data.products.map((p: Obj) => displayProduct(p, now));
  const candidates = ["tai-nghe", "ban-phim", "loa"]
    .map((slug) =>
      products.find((p: Obj) => p.category_slug === slug && p.images[0]),
    )
    .filter(Boolean);
  const heroes = candidates.length ? candidates : products.slice(0, 3);
  const hero = heroes[heroIndex % Math.max(1, heroes.length)];
  const active = products.filter((p: Obj) => saleState(p, now) === "active");
  const upcoming = products
    .filter((p: Obj) => saleState(p, now) === "scheduled")
    .sort(
      (a: Obj, b: Obj) => timestamp(a.flash_start) - timestamp(b.flash_start),
    );
  const featured = products.filter(
    (p: Obj) => Number(p.pinned) || Number(p.featured),
  );
  const selected = (featured.length ? featured : products).slice(0, 4);
  const extra = products
    .filter((p: Obj) => !selected.some((s: Obj) => s.id === p.id))
    .slice(0, 4);
  const categories = data.categories.filter((c: Obj) =>
    products.some((p: Obj) => p.category_id === c.id),
  );
  return (
    <div className="container cx-home">
      <section className="cx-hero" aria-labelledby="cx-home-title">
        <div className="cx-hero-copy">
          <span className="cx-eyebrow">
            <span />
            THIẾT BỊ CHO MỖI NGÀY
          </span>
          <h1 id="cx-home-title">
            Phụ kiện công nghệ.
            <br />
            <span>Chọn đúng thứ cần.</span>
          </h1>
          <p>
            Từ một bản nhạc đến một ngày làm việc.
            <br />
            Tai nghe, bàn phím và những món phụ kiện phù hợp với bạn.
          </p>
          <div className="cx-hero-actions">
            <Link className="cx-button" to="/products">
              Khám phá sản phẩm
              <ArrowRight size={18} />
            </Link>
            <Link className="cx-hero-sale-link" to="/flash-sale">
              <Zap size={16} />
              Xem flash sale
            </Link>
          </div>
          <div
            className="cx-hero-picker"
            role="group"
            aria-label="Chọn sản phẩm giới thiệu"
          >
            {heroes.map((p: Obj, i: number) => {
              const Icon =
                categoryIcons[
                  data.categories.find((c: Obj) => c.id === p.category_id)?.icon
                ] || Cable;
              return (
                <button
                  key={p.id}
                  aria-pressed={heroIndex % heroes.length === i}
                  onClick={() => setHeroIndex(i)}
                >
                  <Icon size={18} />
                  {p.category}
                </button>
              );
            })}
          </div>
        </div>
        <div className="cx-hero-feature">
          {hero ? (
            <>
              <Link className="cx-hero-image" to={"/product/" + hero.slug}>
                <img
                  src={asset(hero.images[0])}
                  alt={hero.name}
                  fetchPriority="high"
                />
                <span className="cx-image-index">
                  OD. SELECTED /{" "}
                  {String((heroIndex % heroes.length) + 1).padStart(2, "0")}
                </span>
              </Link>
              <div className="cx-hero-caption">
                <div>
                  <span>{hero.brand}</span>
                  <Link to={"/product/" + hero.slug}>{hero.name}</Link>
                </div>
                <strong>{money(hero.price)}</strong>
                <Link
                  className="cx-round-link"
                  to={"/product/" + hero.slug}
                  aria-label={"Xem " + hero.name}
                >
                  <ArrowUpRight size={21} />
                </Link>
              </div>
            </>
          ) : (
            <div className="cx-empty-hero">
              <ImageIcon size={40} />
              <span>Sản phẩm đang được cập nhật</span>
            </div>
          )}
        </div>
      </section>
      <CatalogueSale active={active} upcoming={upcoming} />
      <div className="cx-services">
        <span>
          <ShoppingBag size={18} />
          Mua không cần tài khoản
        </span>
        <span>
          <Truck size={19} />
          Phí giao theo vị trí nhận
        </span>
        <Link to="/lookup">
          <Package size={18} />
          Tra đơn bằng số điện thoại
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="cx-categories">
        <div className="cx-section-heading">
          <div>
            <span className="cx-eyebrow">TÌM THEO NHU CẦU</span>
            <h2>Bạn đang tìm gì?</h2>
          </div>
          <Link className="cx-text-link" to="/products">
            Tất cả danh mục
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="cx-category-grid">
          {categories.map((c: Obj) => {
            const Icon = categoryIcons[c.icon] || Cable;
            return (
              <Link to={"/products?category=" + c.slug} key={c.id}>
                <span className="cx-category-icon">
                  <Icon size={25} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>{c.name}</h3>
                  <span>
                    {products.filter((p: Obj) => p.category_id === c.id).length}{" "}
                    sản phẩm
                  </span>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            );
          })}
        </div>
      </section>
      {selected.length > 0 && (
        <section className="cx-featured">
          <div className="cx-section-heading">
            <div>
              <span className="cx-eyebrow">TRÊN KỆ OD.</span>
              <h2>
                {featured.length ? "Sản phẩm nổi bật" : "Khám phá sản phẩm"}
              </h2>
            </div>
            <Link className="cx-text-link" to="/products">
              Xem tất cả
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="cx-product-grid">
            {selected.map((p: Obj) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
      <section className="cx-workspace">
        <div className="cx-workspace-photo">
          <img
            src={asset("images/desk.jpg")}
            alt="Góc làm việc cùng bàn phím và phụ kiện"
            loading="lazy"
          />
        </div>
        <div className="cx-workspace-copy">
          <span className="cx-eyebrow">CHO GÓC LÀM VIỆC</span>
          <h2>
            Gọn bàn làm việc.
            <br />
            Rõ điều cần làm.
          </h2>
          <p>
            Chọn bàn phím và chuột theo cách bạn sử dụng. Từ một góc làm việc
            tại nhà đến bàn máy mỗi ngày.
          </p>
          <Link className="cx-button" to="/products?category=ban-phim">
            Khám phá bàn phím
            <ArrowUpRight size={18} />
          </Link>
          <Link className="cx-text-link" to="/products?category=chuot">
            Xem chuột & phụ kiện
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      {extra.length > 0 && (
        <section className="cx-extra">
          <div className="cx-section-heading">
            <div>
              <span className="cx-eyebrow">THÊM LỰA CHỌN</span>
              <h2>Khám phá thêm</h2>
            </div>
            <Link className="cx-text-link" to="/products">
              Vào cửa hàng
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="cx-product-grid">
            {extra.map((p: Obj) => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
