import {
  ArrowRight,
  ArrowUpRight,
  Cable,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Keyboard,
  Mouse,
  Package,
  ShoppingBag,
  Speaker,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { asset, date, type Obj } from "./api";
import { ProductCard } from "./catalogue-product";
import { useStore } from "./context";
import { BannerCarousel } from "./features/home/BannerCarousel";
import { BrandMarquee } from "./features/home/BrandMarquee";
import { tx } from "./i18n";
import {
  displayProduct,
  remaining,
  saleState,
  timestamp,
  useNow,
} from "./promotions";
import { Loading } from "./ui";
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
    ...(time.days > 0 ? [[time.days, tx("ngày")]] : []),
    [time.hours, tx("giờ")],
    [time.minutes, tx("phút")],
    [time.seconds, tx("giây")],
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
                ? tx("Ưu đãi đang diễn ra")
                : upcoming.length
                  ? tx("Ưu đãi sắp mở")
                  : tx("Ưu đãi có hẹn")}
            </p>
            <h2 id="cx-sale-title">
              {tx("Flash sale")}
              <span>.</span>
            </h2>
          </div>
        </div>
        {nextEnd && (
          <SaleClock
            end={nextEnd}
            label={
              active.length
                ? tx("Ưu đãi gần nhất kết thúc sau")
                : tx("Phiên tiếp theo bắt đầu sau")
            }
          />
        )}
        <Link className="cx-sale-link" to="/flash-sale">
          {tx("Xem tất cả")}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      {shown.length > 0 ? (
        <div className="cx-sale-body">
          <div className="cx-sale-toolbar">
            <span>
              {active.length
                ? tx("{0} sản phẩm đang ưu đãi", [active.length])
                : tx("Mở lúc {0}", [date(upcoming[0].flash_start)])}
            </span>
            {shown.length > 1 && (
              <div className="cx-rail-buttons">
                <button
                  type="button"
                  disabled={scroll.left}
                  onClick={() => move(-1)}
                  aria-label={tx("Sản phẩm flash sale trước")}
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label={tx("Sản phẩm flash sale tiếp")}
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
            aria-label={tx("Danh sách flash sale, vuốt ngang để xem thêm")}
          >
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {(!scroll.left || scroll.right) && (
            <span className="cx-swipe-hint">
              {tx("Vuốt hoặc dùng mũi tên để xem thêm sản phẩm")}
            </span>
          )}
        </div>
      ) : (
        <div className="cx-sale-empty">
          <Zap size={28} />
          <div>
            <h3>{tx("Phiên mới sẽ xuất hiện tại đây")}</h3>
            <p>
              {tx(
                "Cửa hàng chưa có flash sale đang mở. Bạn vẫn có thể xem toàn bộ sản phẩm.",
              )}
            </p>
          </div>
          <Link to="/products">
            {tx("Xem sản phẩm")}
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
  if (!data) return <Loading />;
  const products = data.products.map((p: Obj) => displayProduct(p, now));
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
      <BannerCarousel />
      <CatalogueSale active={active} upcoming={upcoming} />
      <BrandMarquee />
      <div className="cx-services">
        <span>
          <ShoppingBag size={18} />
          {tx("Mua không cần tài khoản")}
        </span>
        <span>
          <Truck size={19} />
          {tx("Phí giao theo vị trí nhận")}
        </span>
        <Link to="/lookup">
          <Package size={18} />
          {tx("Tra đơn bằng số điện thoại")}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="cx-categories">
        <div className="cx-section-heading">
          <div>
            <span className="cx-eyebrow">{tx("TÌM THEO NHU CẦU")}</span>
            <h2>{tx("Bạn đang tìm gì?")}</h2>
          </div>
          <Link className="cx-text-link" to="/products">
            {tx("Tất cả danh mục")}
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
                    {tx("sản phẩm")}
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
              <span className="cx-eyebrow">{tx("TRÊN KỆ OD.")}</span>
              <h2>
                {featured.length
                  ? tx("Sản phẩm nổi bật")
                  : tx("Khám phá sản phẩm")}
              </h2>
            </div>
            <Link className="cx-text-link" to="/products">
              {tx("Xem tất cả")}
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
            alt={tx("Góc làm việc cùng bàn phím và phụ kiện")}
            loading="lazy"
          />
        </div>
        <div className="cx-workspace-copy">
          <span className="cx-eyebrow">{tx("CHO GÓC LÀM VIỆC")}</span>
          <h2>
            {tx("Gọn bàn làm việc.")}
            <br />
            {tx("Rõ điều cần làm.")}
          </h2>
          <p>
            {tx(
              "Chọn bàn phím và chuột theo cách bạn sử dụng. Từ một góc làm việc tại nhà đến bàn máy mỗi ngày.",
            )}
          </p>
          <Link className="cx-button" to="/products?category=ban-phim">
            {tx("Khám phá bàn phím")}
            <ArrowUpRight size={18} />
          </Link>
          <Link className="cx-text-link" to="/products?category=chuot">
            {tx("Xem chuột & phụ kiện")}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      {extra.length > 0 && (
        <section className="cx-extra">
          <div className="cx-section-heading">
            <div>
              <span className="cx-eyebrow">{tx("THÊM LỰA CHỌN")}</span>
              <h2>{tx("Khám phá thêm")}</h2>
            </div>
            <Link className="cx-text-link" to="/products">
              {tx("Vào cửa hàng")}
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
