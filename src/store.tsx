import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  ShoppingBag,
  Menu,
  X,
  Headphones,
  Keyboard,
  Mouse,
  Speaker,
  Cable,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  MapPin,
  Check,
  Package,
  Clock,
  Download,
  Printer,
  Lock,
  Mail,
  CheckCircle2,
  Navigation,
  Heart,
  ChevronDown,
  Tag,
  Zap,
  Pin,
  House,
  Grid2X2,
} from "lucide-react";
import { api, asset, money, date, status, type Obj } from "./api";
import {
  useNow,
  saleState,
  displayProduct,
  savings,
  remaining,
  timestamp,
  currentTime,
} from "./promotions";
import { useStore } from "./context";
import {
  Button,
  Empty,
  Loading,
  Field,
  Modal,
  Badge,
  SectionTitle,
  ErrorBox,
} from "./ui";

import { AddressSearch } from "./address-search";
import { FreeMapPicker } from "./free-map";
import { rememberOrder, PhoneLookup } from "./phone-lookup";
const icons: Obj = {
  headphones: Headphones,
  keyboard: Keyboard,
  mouse: Mouse,
  speaker: Speaker,
  cable: Cable,
};
export function Layout() {
  const { data, error, count, setCartOpen, cartOpen } = useStore();
  const [menu, setMenu] = useState(false),
    [q, setQ] = useState("");
  const nav = useNavigate();
  const now = useNow();
  const active = (data?.products || []).filter(
    (p: Obj) => saleState(p, now) === "active",
  );
  return (
    <div className="storefront">
      <div className="announcement">
        <span>
          {data?.store?.banner || "Phụ kiện công nghệ cho góc riêng của bạn."}
        </span>
        <Link to="/flash-sale">
          {active.length ? (
            <>
              <span className="live-dot" /> Flash sale đang mở
            </>
          ) : (
            <>Xem lịch Flash sale</>
          )}
          <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="OD Store trang chủ">
            od<span>.</span>
          </Link>
          <nav
            className={menu ? "main-nav open" : "main-nav"}
            aria-label="Điều hướng cửa hàng"
          >
            <NavLink to="/" end onClick={() => setMenu(false)}>
              Trang chủ
            </NavLink>
            <NavLink to="/products" onClick={() => setMenu(false)}>
              Sản phẩm
            </NavLink>
            <NavLink
              to="/flash-sale"
              className="sale-nav"
              onClick={() => setMenu(false)}
            >
              <Zap size={14} /> Flash sale{" "}
              {active.length > 0 && (
                <span className="nav-sale-count">{active.length}</span>
              )}
            </NavLink>
            <NavLink to="/lookup" onClick={() => setMenu(false)}>
              Tra cứu đơn
            </NavLink>
          </nav>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              nav("/products?q=" + encodeURIComponent(q));
            }}
          >
            <Search size={17} />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm món đồ của bạn"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <button
            className="icon-button cart-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Giỏ hàng ${count} sản phẩm`}
          >
            <ShoppingBag size={21} />
            {count > 0 && <span>{count}</span>}
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label={menu ? "Đóng menu" : "Mở menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        {error && !data ? (
          <div className="container page">
            <ErrorBox>{error}</ErrorBox>
            <Button onClick={() => location.reload()}>Thử lại</Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Link to="/" className="logo">
                od<span>.</span>
              </Link>
              <h3>
                Đồ công nghệ.
                <br />
                Có chỗ trong ngày của bạn.
              </h3>
              <p>
                Tai nghe, bàn phím, chuột và loa. Chọn món phù hợp, dùng mỗi
                ngày.
              </p>
            </div>
            <div>
              <h4>Cửa hàng</h4>
              <Link to="/products">Tất cả sản phẩm</Link>
              <Link to="/flash-sale">Flash sale & lịch ưu đãi</Link>
              <Link to="/lookup">Theo dõi đơn hàng</Link>
              <Link to="/admin">Quản trị cửa hàng</Link>
            </div>
            <div>
              <h4>Nói chuyện với OD.</h4>
              <a href={"tel:" + data?.store?.phone}>
                {data?.store?.phone || "Liên hệ cửa hàng"}
              </a>
              <a href={"mailto:" + data?.store?.email}>{data?.store?.email}</a>
              <p>{data?.store?.address}</p>
              <span className="footer-payment">
                <Lock size={12} /> COD · Chuyển khoản
              </span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {data?.store?.name || "OD. Store"}
            </span>
            <span>Giá và tình trạng hàng được cập nhật từ cửa hàng.</span>
            <a
              href="#top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Lên đầu trang ↑
            </a>
          </div>
        </div>
      </footer>
      <nav className="mobile-dock" aria-label="Điều hướng nhanh">
        <NavLink to="/" end>
          <House size={19} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink to="/products">
          <Grid2X2 size={19} />
          <span>Sản phẩm</span>
        </NavLink>
        <NavLink to="/flash-sale">
          <Zap size={19} />
          <span>Flash sale</span>
          {active.length > 0 && <i />}
        </NavLink>
        <NavLink to="/lookup">
          <Package size={19} />
          <span>Đơn hàng</span>
        </NavLink>
        <button onClick={() => setCartOpen(true)}>
          <ShoppingBag size={19} />
          <span>Giỏ hàng{count ? " · " + count : ""}</span>
        </button>
      </nav>
      {cartOpen && (
        <Modal title="Giỏ hàng của bạn" onClose={() => setCartOpen(false)}>
          <CartContent drawer />
        </Modal>
      )}
    </div>
  );
}
function ProductCard({ p: source, number }: { p: Obj; number?: number }) {
  const { add } = useStore();
  const now = useNow();
  const p = displayProduct(source, now);
  const active = saleState(p, now) === "active";
  const percent = savings(p);
  const stock = p.variants.reduce(
    (s: number, v: Obj) => s + Number(v.stock),
    0,
  );
  const isNew =
    now - timestamp(p.created_at) < 14 * 86400000 &&
    now >= timestamp(p.created_at);
  const [liked, setLiked] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("od.favs") || "[]").includes(
          p.id,
        );
      } catch {
        return false;
      }
    }),
    [added, setAdded] = useState(false);
  useEffect(() => {
    if (added) {
      const t = setTimeout(() => setAdded(false), 1700);
      return () => clearTimeout(t);
    }
  }, [added]);
  const toggle = () => {
    try {
      const f = JSON.parse(localStorage.getItem("od.favs") || "[]");
      localStorage.setItem(
        "od.favs",
        JSON.stringify(
          liked ? f.filter((id: any) => id !== p.id) : [...f, p.id],
        ),
      );
      setLiked(!liked);
    } catch {}
  };
  const quickAdd = () => {
    if (p.variants.length > 1) {
      location.hash = "/product/" + p.slug;
      return;
    }
    add(Number(p.variants[0].id));
    setAdded(true);
  };
  return (
    <article
      className={`product-card ${active ? "on-sale" : ""} ${added ? "just-added" : ""}`}
    >
      <div className="product-image">
        <Link to={"/product/" + p.slug}>
          <img src={asset(p.images[0])} alt={p.name} loading="lazy" />
        </Link>
        <div className="product-badges">
          {!stock ? (
            <Badge>Hết hàng</Badge>
          ) : active && percent > 0 ? (
            <Badge tone="lime">
              <Zap size={11} />
              &nbsp;FLASH SALE · −{percent}%
            </Badge>
          ) : isNew ? (
            <Badge>Mới về</Badge>
          ) : Number(p.pinned) ? (
            <Badge>
              <Pin size={10} />
              &nbsp;OD. chọn
            </Badge>
          ) : null}
        </div>
        <button
          className={`favorite ${liked ? "selected" : ""}`}
          onClick={toggle}
          aria-label={liked ? "Bỏ yêu thích" : "Lưu yêu thích"}
          aria-pressed={liked}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
        {number != null && (
          <span className="product-index">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <button className="quick-add" disabled={!stock} onClick={quickAdd}>
          {added ? (
            <>
              <Check size={15} /> Đã thêm vào giỏ
            </>
          ) : (
            <>
              {p.variants.length > 1 ? "Chọn phiên bản" : "Thêm vào giỏ"}
              <Plus size={15} />
            </>
          )}
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span className="product-brand">{p.brand}</span>
          {stock > 0 && stock <= 5 && (
            <span className="stock-chip">Còn {stock}</span>
          )}
        </div>
        <Link to={"/product/" + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <p>{p.variants[0]?.name}</p>
        <div className="product-bottom">
          <div>
            <strong>{money(p.price)}</strong>
            {active && percent > 0 && (
              <del>{money(p.variants[0]?.compare_price)}</del>
            )}
          </div>
          <button
            className="add-button"
            disabled={!stock}
            onClick={quickAdd}
            aria-label={"Thêm " + p.name}
          >
            {added ? <Check size={17} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}
export function Home() {
  const { data } = useStore();
  const now = useNow();
  const [heroIndex, setHeroIndex] = useState(0);
  if (!data) return <Loading />;
  const products = data.products.map((p: Obj) => displayProduct(p, now));
  const categories = data.categories;
  const candidates = [
    ["tai-nghe", "Âm thanh.\nKhông dây.", "Âm thanh"],
    ["ban-phim", "Gõ chính xác.\nLàm tập trung.", "Góc làm việc"],
    ["loa", "Bật nhạc.\nĐổi nhịp.", "Loa & âm nhạc"],
  ]
    .map(([slug, title, label]) => ({
      product: products.find((p: Obj) => p.category_slug === slug),
      title,
      label,
    }))
    .filter((x) => x.product);
  const picked = candidates[heroIndex % candidates.length] || {
    product: products[0],
    title: "Đồ công nghệ.\nChọn cho mỗi ngày.",
    label: "OD. Store",
  };
  const hero = picked.product;
  const active = products.filter((p: Obj) => saleState(p, now) === "active");
  const scheduled = products
    .filter((p: Obj) => saleState(p, now) === "scheduled")
    .sort(
      (a: Obj, b: Obj) => timestamp(a.flash_start) - timestamp(b.flash_start),
    );
  const selected = products.filter(
    (p: Obj) => Number(p.pinned) || Number(p.featured),
  );
  const work = products.find((p: Obj) => p.category_slug === "ban-phim");
  return (
    <div className="container home-v2">
      <div className="edition-line">
        <span>ĐỒ DÙNG CHO NHỮNG GIỜ CỦA BẠN</span>
        <span>OD. / CÔNG NGHỆ & CUỘC SỐNG</span>
      </div>
      <section className="cover-story">
        <div className="cover-copy">
          <span className="story-label">
            <span className="tiny-square" />
            {picked.label}
          </span>
          <h1>
            {picked.title.split("\n").map((t, i) => (
              <span key={t} className={i === 1 ? "cover-last" : ""}>
                {t}
                <br />
              </span>
            ))}
          </h1>
          <p>
            {hero
              ? hero.description.split(". ").slice(0, 2).join(". ") + "."
              : "Chọn phụ kiện cho việc bạn làm và những thứ bạn thích."}
          </p>
          <Link
            className="button dark"
            to={hero ? "/product/" + hero.slug : "/products"}
          >
            Xem sản phẩm <ArrowUpRight size={18} />
          </Link>
          <div className="story-controls" aria-label="Chọn bộ sưu tập">
            {candidates.map((x, i) => (
              <button
                key={x.label}
                onClick={() => setHeroIndex(i)}
                className={heroIndex % candidates.length === i ? "active" : ""}
                aria-pressed={heroIndex % candidates.length === i}
              >
                <span>0{i + 1}</span>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="cover-media" key={hero?.id || "empty"}>
          {hero && (
            <>
              <img
                className="cover-product"
                src={asset(hero.images[0])}
                alt={hero.name}
              />
              <span className="cover-stamp">
                OD.
                <br />
                <small>SELECTED</small>
              </span>
              <div className="cover-caption">
                <div>
                  <span>{hero.brand}</span>
                  <Link to={"/product/" + hero.slug}>{hero.name}</Link>
                </div>
                <strong>{money(hero.price)}</strong>
                <Link
                  className="cover-buy"
                  to={"/product/" + hero.slug}
                  aria-label={"Xem " + hero.name}
                >
                  <ArrowUpRight size={22} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <div className="service-line">
        <span>
          <ShoppingBag size={14} /> Mua nhanh, không cần tài khoản
        </span>
        <span>
          <Truck size={15} /> Phí giao theo quãng đường
        </span>
        <Link to="/lookup">
          <Package size={14} /> Theo dõi đơn mọi lúc <ArrowUpRight size={13} />
        </Link>
      </div>
      <FlashSaleBlock products={active} upcoming={scheduled[0]} />
      <section className="discovery">
        <div className="section-caption">
          <span>01 / TÌM THEO NHU CẦU</span>
          <p>Bạn muốn nâng cấp điều gì?</p>
        </div>
        <div className="category-rail">
          {categories.map((c: Obj, i: number) => {
            const Icon = icons[c.icon] || Cable;
            return (
              <Link to={"/products?category=" + c.slug} key={c.id}>
                <span className="category-no">0{i + 1}</span>
                <Icon size={28} strokeWidth={1.25} />
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {products.filter((p: Obj) => p.category_id === c.id).length}{" "}
                    sản phẩm
                  </small>
                </div>
                <ArrowUpRight size={17} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="selected-section">
        <div className="editorial-heading">
          <div>
            <p className="eyebrow">02 / TRÊN KỆ OD.</p>
            <h2>
              Một vài món.
              <br />
              <span>Dùng suốt ngày.</span>
            </h2>
          </div>
          <Link className="text-link" to="/products">
            Khám phá tất cả <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {selected.slice(0, 4).map((p: Obj, i: number) => (
            <ProductCard p={p} key={p.id} number={i + 1} />
          ))}
        </div>
      </section>
      <section className="workspace-story">
        <div className="workspace-photo">
          <img
            src={asset("images/desk.jpg")}
            alt="Góc làm việc với ánh sáng ấm"
            loading="lazy"
          />
          <span>GÓC RIÊNG / KHÔNG GIAN LÀM VIỆC</span>
        </div>
        <div className="workspace-copy">
          <span className="story-label">Một bàn làm việc, nhiều cảm hứng.</span>
          <h2>
            Chạm phím.
            <br />
            <em>Vào guồng.</em>
          </h2>
          <p>
            Dành chỗ cho chiếc bàn phím vừa tay, con chuột di chuyển mượt và
            khoảng trống để tập trung.
          </p>
          <Link className="text-link" to="/products?category=ban-phim">
            Xem bàn phím & phụ kiện <ArrowUpRight size={17} />
          </Link>
          {work && (
            <Link className="workspace-pick" to={"/product/" + work.slug}>
              <img src={asset(work.images[0])} alt={work.name} loading="lazy" />
              <div>
                <small>GỢI Ý CHO GÓC LÀM VIỆC</small>
                <strong>{work.name}</strong>
                <span>{money(work.price)}</span>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          )}
        </div>
      </section>
      {selected.length > 4 && (
        <section className="more-essentials">
          <div className="editorial-heading">
            <div>
              <p className="eyebrow">03 / THÊM MỘT VÀI LỰA CHỌN</p>
              <h2>Có thể hợp với bạn.</h2>
            </div>
            <Link className="text-link" to="/products">
              Xem cửa hàng <ArrowRight size={16} />
            </Link>
          </div>
          <div className="product-grid">
            {selected.slice(4, 8).map((p: Obj) => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        </section>
      )}
      <div className="store-note">
        <span className="note-number">od.</span>
        <p>
          Tìm món đồ hợp cách bạn làm việc,
          <br />
          nghe nhạc và dành thời gian cho mình.
        </p>
        <Link to="/products">
          Vào cửa hàng <ArrowUpRight size={19} />
        </Link>
      </div>
    </div>
  );
}
function Countdown({
  end,
  label = "Kết thúc sau",
}: {
  end: string;
  label?: string;
}) {
  const now = useNow();
  const time = remaining(end, now);
  return (
    <div className="sale-countdown" aria-label={label}>
      <span>{label}</span>
      <div>
        {time.days > 0 && (
          <>
            <b>
              {String(time.days).padStart(2, "0")}
              <small>ngày</small>
            </b>
            <i>:</i>
          </>
        )}
        {[
          ["giờ", time.hours],
          ["phút", time.minutes],
          ["giây", time.seconds],
        ].map(([label, n], i) => (
          <span className="time-part" key={label}>
            {i > 0 && <i>:</i>}
            <b>
              {String(n).padStart(2, "0")}
              <small>{label}</small>
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}
function FlashSaleBlock({
  products,
  upcoming,
}: {
  products: Obj[];
  upcoming?: Obj;
}) {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <section className="flash-section">
      <div className="flash-heading">
        <span className="flash-kicker">
          <Zap size={15} />
          {products.length ? "FLASH SALE · ĐANG MỞ" : "LỊCH ƯU ĐÃI"}
        </span>
        <h2>
          Flash <span>sale.</span>
        </h2>
        <p>
          {products.length
            ? "Giá đã giảm. Đặt trong thời gian ưu đãi."
            : upcoming
              ? "Phiên tiếp theo đã lên lịch. Xem trước sản phẩm và thời gian mở."
              : "Các phiên ưu đãi có thời gian mở và kết thúc rõ ràng."}
        </p>
        <Link className="button dark" to="/flash-sale">
          {products.length ? "Xem tất cả ưu đãi" : "Xem lịch Flash sale"}{" "}
          <ArrowUpRight size={16} />
        </Link>
        {(products[0] || upcoming) && (
          <Countdown
            end={products[0]?.flash_end || upcoming!.flash_start}
            label={
              products.length
                ? "Phiên gần nhất kết thúc sau"
                : "Phiên tiếp theo mở sau"
            }
          />
        )}
      </div>
      <div className="flash-rail-wrap">
        {products.length > 1 && (
          <div className="flash-rail-controls">
            <span>{products.length} sản phẩm · kéo để xem thêm</span>
            <button
              type="button"
              aria-label="Sản phẩm Flash sale trước"
              onClick={() =>
                rail.current?.scrollBy({ left: -320, behavior: "smooth" })
              }
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Sản phẩm Flash sale tiếp"
              onClick={() =>
                rail.current?.scrollBy({ left: 320, behavior: "smooth" })
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <div
          className="flash-products"
          ref={rail}
          tabIndex={0}
          aria-label="Sản phẩm flash sale, cuộn ngang để xem tất cả"
        >
          {products.length ? (
            products.map((p: Obj) => <ProductCard p={p} key={p.id} />)
          ) : upcoming ? (
            <div className="next-sale">
              <img src={asset(upcoming.images[0])} alt={upcoming.name} />
              <div>
                <Badge>Sắp mở</Badge>
                <h3>{upcoming.name}</h3>
                <p>{date(upcoming.flash_start)}</p>
                <Link className="text-link" to="/flash-sale">
                  Xem phiên sắp mở <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="no-sale">
              <Zap size={35} strokeWidth={1} />
              <h3>Chưa có phiên đang mở</h3>
              <p>
                Sản phẩm và giá ưu đãi sẽ xuất hiện tại đây khi cửa hàng mở
                phiên.
              </p>
              <Link className="text-link" to="/products">
                Xem sản phẩm hiện có <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
export function FlashSales() {
  const { data } = useStore();
  const now = useNow();
  const [tab, setTab] = useState("active");
  if (!data) return <Loading />;
  const all = data.products.map((p: Obj) => displayProduct(p, now));
  const active = all.filter((p: Obj) => saleState(p, now) === "active"),
    upcoming = all
      .filter((p: Obj) => saleState(p, now) === "scheduled")
      .sort(
        (a: Obj, b: Obj) => timestamp(a.flash_start) - timestamp(b.flash_start),
      );
  const shown = tab === "active" ? active : upcoming;
  return (
    <div className="container page flash-page">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} />
        <span>Flash sale</span>
      </div>
      <div className="flash-page-heading">
        <div>
          <span className="flash-kicker">
            <Zap size={16} /> ƯU ĐÃI CÓ THỜI GIAN
          </span>
          <h1>
            Đúng lúc.
            <br />
            <span>Đúng giá.</span>
          </h1>
          <p>Giá ưu đãi tự áp dụng trong thời gian đã lên lịch.</p>
        </div>
        {(active[0] || upcoming[0]) && (
          <Countdown
            end={active[0]?.flash_end || upcoming[0].flash_start}
            label={
              active.length
                ? "Phiên gần nhất kết thúc sau"
                : "Phiên tiếp theo mở sau"
            }
          />
        )}
      </div>
      <div className="sale-tabs">
        <button
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          <span className="live-dot" /> Đang mở <Badge>{active.length}</Badge>
        </button>
        <button
          className={tab === "scheduled" ? "active" : ""}
          onClick={() => setTab("scheduled")}
        >
          <Clock size={15} /> Sắp diễn ra <Badge>{upcoming.length}</Badge>
        </button>
      </div>
      {shown.length ? (
        <div className="sale-page-grid">
          {shown.map((p: Obj) => (
            <div className="sale-item" key={p.id}>
              {tab === "scheduled" && (
                <div className="sale-opening">Mở lúc {date(p.flash_start)}</div>
              )}
              <ProductCard p={p} />
              <div className="sale-card-footer">
                {tab === "active" ? (
                  <Countdown end={p.flash_end} />
                ) : (
                  <p>
                    Giá khi mở: <strong>{money(p.flash_price)}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === "active"
              ? "Chưa có phiên Flash sale đang mở"
              : "Chưa có phiên sắp diễn ra"
          }
          icon={<Zap />}
        >
          {tab === "active" && upcoming.length
            ? "Chuyển sang “Sắp diễn ra” để xem lịch ưu đãi."
            : "Bạn vẫn có thể xem giá và sản phẩm đang bán trong cửa hàng."}
        </Empty>
      )}
    </div>
  );
}

export function Catalog() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || ""),
    [sort, setSort] = useState("selected"),
    [inStock, setInStock] = useState(false),
    [max, setMax] = useState(3000000),
    [filter, setFilter] = useState(false);
  useEffect(() => setQ(params.get("q") || ""), [params]);
  if (!data) return <Loading />;
  const cat = params.get("category") || "";
  let products = data.products
    .map((p: Obj) => displayProduct(p, currentTime()))
    .filter(
      (p: Obj) =>
        (!cat || p.category_slug === cat) &&
        (!params.get("sale") ||
          (p.flash_price &&
            new Date(p.flash_start.replace(" ", "T") + "+07:00") <=
              new Date() &&
            new Date(p.flash_end.replace(" ", "T") + "+07:00") > new Date())) &&
        (!q ||
          `${p.name} ${p.brand} ${p.description}`
            .toLocaleLowerCase("vi")
            .includes(q.toLocaleLowerCase("vi"))) &&
        p.price <= max &&
        (!inStock || p.variants.some((v: Obj) => v.stock > 0)),
    );
  if (sort === "price-asc")
    products = [...products].sort((a: Obj, b: Obj) => a.price - b.price);
  if (sort === "price-desc")
    products = [...products].sort((a: Obj, b: Obj) => b.price - a.price);
  if (sort === "newest")
    products = [...products].sort((a: Obj, b: Obj) => b.id - a.id);
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} />
        <span>Sản phẩm</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SẢN PHẨM / OD. STORE</p>
          <h1>{params.get("sale") ? "Ưu đãi hôm nay" : "Chọn món bạn cần."}</h1>
          <p>Tai nghe, bàn phím, chuột, loa — theo cách bạn dùng mỗi ngày.</p>
        </div>
        <span className="muted">{products.length} sản phẩm</span>
      </div>
      <div className="catalog-tools">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder="Tìm tai nghe, bàn phím, loa…"
            aria-label="Tìm kiếm sản phẩm"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              const p = new URLSearchParams(params);
              p.set("q", e.target.value);
              setParams(p, { replace: true });
            }}
          />
        </div>
        <Button variant="outline" onClick={() => setFilter(!filter)}>
          <SlidersHorizontal size={17} /> Bộ lọc
        </Button>
        <select
          aria-label="Sắp xếp sản phẩm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="selected">OD. đề xuất</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>
      <div className="category-tabs">
        <button
          className={!cat ? "active" : ""}
          onClick={() => {
            const p = new URLSearchParams(params);
            p.delete("category");
            setParams(p);
          }}
        >
          Tất cả
        </button>
        {data.categories.map((c: Obj) => (
          <button
            key={c.id}
            className={cat === c.slug ? "active" : ""}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set("category", c.slug);
              setParams(p);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      {filter && (
        <div className="filter-panel">
          <Field label={"Giá tối đa: " + money(max)}>
            <input
              type="range"
              min="100000"
              max="3000000"
              step="10000"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />{" "}
            Chỉ hiện sản phẩm còn hàng
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setMax(3000000);
              setInStock(false);
              setParams({});
              setQ("");
            }}
          >
            Xoá bộ lọc
          </Button>
        </div>
      )}
      {products.length ? (
        <div className="product-grid">
          {products.map((p: Obj) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty title="Chưa tìm thấy sản phẩm">
          Thử đổi từ khoá hoặc điều chỉnh bộ lọc nhé.
        </Empty>
      )}
    </div>
  );
}
export function Product() {
  const now = useNow();
  const { slug } = useParams();
  const { data, add, setCartOpen } = useStore();
  const [variant, setVariant] = useState(0),
    [qty, setQty] = useState(1),
    [image, setImage] = useState(0);
  useEffect(() => {
    setVariant(0);
    setImage(0);
    setQty(1);
  }, [slug]);
  if (!data) return <Loading />;
  const source = data.products.find((x: Obj) => x.slug === slug);
  const p = source ? displayProduct(source, now) : null;
  if (!p)
    return (
      <Empty title="Sản phẩm không còn được bán">
        Khám phá những lựa chọn khác trong cửa hàng.
      </Empty>
    );
  const v = p.variants[variant];
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} />
        <Link to="/products">Sản phẩm</Link>
        <ChevronRight size={13} />
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <img src={asset(p.images[image])} alt={p.name} />
          </div>
          <div className="thumbnails">
            {p.images.map((url: string, i: number) => (
              <button
                key={url}
                className={i === image ? "active" : ""}
                onClick={() => setImage(i)}
                aria-label={"Xem ảnh " + (i + 1)}
              >
                <img src={asset(url)} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {p.brand} / {p.category}
          </span>
          <h1>{p.name}</h1>
          <div className="detail-price">{money(v?.price)}</div>
          <p className="detail-description">{p.description}</p>
          <Field label="Phiên bản">
            <div className="variant-options">
              {p.variants.map((x: Obj, i: number) => (
                <button
                  className={variant === i ? "active" : ""}
                  key={x.id}
                  onClick={() => {
                    setVariant(i);
                    setQty(1);
                  }}
                >
                  {x.name}
                  {variant === i && <Check size={14} />}
                </button>
              ))}
            </div>
          </Field>
          <p className="stock-status">
            <span className={Number(v?.stock) > 0 ? "lime-dot" : "grey-dot"} />
            {Number(v?.stock) > 0
              ? `Sẵn hàng · ${v.stock} sản phẩm`
              : "Tạm hết hàng"}
            <span className="muted">SKU: {v?.sku}</span>
          </p>
          <div className="buy-row">
            <Quantity
              quantity={qty}
              max={Number(v?.stock)}
              onChange={(n) => setQty(Math.max(1, n))}
            />
            <Button
              variant="dark"
              disabled={!v || Number(v.stock) < qty}
              onClick={() => {
                add(Number(v.id), qty);
                setCartOpen(true);
              }}
            >
              <ShoppingBag size={18} /> Thêm vào giỏ hàng{" "}
              <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="detail-promises">
            <p>
              <Truck size={18} /> Phí giao tính theo quãng đường thực tế
            </p>
            <p>
              <ShieldCheck size={18} /> Kiểm tra đơn và tổng tiền trước khi xác
              nhận
            </p>
            <p>
              <Lock size={18} /> Mua nhanh, không cần tài khoản
            </p>
          </div>
        </div>
      </div>
      <section className="section">
        <SectionTitle title="Có thể bạn cũng thích" />
        <div className="product-grid">
          {data.products
            .filter((x: Obj) => x.id !== p.id)
            .slice(0, 4)
            .map((x: Obj) => (
              <ProductCard key={x.id} p={x} />
            ))}
        </div>
      </section>
    </div>
  );
}
export function Quantity({
  quantity,
  onChange,
  max = 99,
}: {
  quantity: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity">
      <button aria-label="Giảm số lượng" onClick={() => onChange(quantity - 1)}>
        <Minus size={14} />
      </button>
      <span>{quantity}</span>
      <button
        aria-label="Tăng số lượng"
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
function CartContent({ drawer = false }: { drawer?: boolean }) {
  const { cart, data, update, setCartOpen, coupon, setCoupon } = useStore();
  const [draft, setDraft] = useState(coupon),
    [quote, setQuote] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (cart.length) {
      setBusy(true);
      api("quote", { items: cart, coupon })
        .then((q) => {
          setQuote(q);
          setError("");
        })
        .catch((e) => {
          setError(e.message);
          setQuote(null);
        })
        .finally(() => setBusy(false));
    }
  }, [cart, coupon]);
  if (!cart.length)
    return (
      <Empty title="Giỏ hàng đang chờ bạn" icon={<ShoppingBag />}>
        <span>Thêm một món đồ bạn thích để bắt đầu.</span>
        <Link
          className="button dark"
          to="/products"
          onClick={() => setCartOpen(false)}
        >
          Khám phá sản phẩm <ArrowRight size={16} />
        </Link>
      </Empty>
    );
  return (
    <div className={drawer ? "cart-content drawer" : "cart-content"}>
      <div className="cart-items">
        {cart.map((item: Obj) => {
          const p = data?.products.find((x: Obj) =>
            x.variants.some((v: Obj) => Number(v.id) === item.variant_id),
          );
          const v = p?.variants.find(
            (x: Obj) => Number(x.id) === item.variant_id,
          );
          return (
            <div className="cart-line" key={item.variant_id}>
              {p && <img src={asset(p.images[0])} alt={p.name} />}
              <div className="cart-line-info">
                <h3>{p?.name || "Sản phẩm đã ngừng bán"}</h3>
                <p>{v?.name}</p>
                <strong>{v ? money(v.price) : "Không khả dụng"}</strong>
                <Quantity
                  quantity={item.quantity}
                  max={Number(v?.stock || 99)}
                  onChange={(n) => update(item.variant_id, n)}
                />
              </div>
              <button
                className="icon-button"
                onClick={() => update(item.variant_id, 0)}
                aria-label="Xoá sản phẩm"
              >
                <Trash2 size={17} />
              </button>
            </div>
          );
        })}
      </div>
      <aside className="cart-summary">
        <h2>Tóm tắt đơn hàng</h2>
        <form
          className="coupon-form"
          onSubmit={(e) => {
            e.preventDefault();
            setCoupon(draft.trim());
          }}
        >
          <Tag size={17} />
          <input
            aria-label="Mã giảm giá"
            placeholder="Mã giảm giá"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button>Áp dụng</button>
        </form>
        {coupon && (
          <button
            className="text-link"
            onClick={() => {
              setCoupon("");
              setDraft("");
            }}
          >
            Bỏ mã {coupon} <X size={14} />
          </button>
        )}
        <ErrorBox>{error}</ErrorBox>
        <div className="totals">
          <p>
            <span>Tạm tính</span>
            <strong>{money(quote?.subtotal)}</strong>
          </p>
          <p>
            <span>Giảm giá</span>
            <strong>{money(quote?.discount || 0)}</strong>
          </p>
          <p>
            <span>Phí giao hàng</span>
            <span>Tính khi checkout</span>
          </p>
          <p className="grand-total">
            <span>Tiền hàng</span>
            <strong>
              {quote ? money(quote.subtotal - quote.discount) : "—"}
            </strong>
          </p>
        </div>
        <Button
          loading={busy}
          disabled={!quote || !!error}
          variant="dark full"
          onClick={() => {
            setCartOpen(false);
            navigate("/checkout");
          }}
        >
          Tiến hành đặt hàng <ArrowRight size={17} />
        </Button>
        <p className="secure-note">
          <Lock size={13} /> Không cần đăng ký tài khoản
        </p>
      </aside>
    </div>
  );
}
export function CartPage() {
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p>
          <h1>Giỏ hàng của bạn.</h1>
        </div>
        <Link className="text-link" to="/products">
          Tiếp tục mua sắm <ArrowRight size={16} />
        </Link>
      </div>
      <CartContent />
    </div>
  );
}
export function Checkout() {
  const { cart, coupon, setCart, setCoupon, setToast } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<Obj>({
      name: "",
      phone: "",
      address: "",
      region: "",
      note: "",
      latitude: "",
      longitude: "",
      payment_method: "cod",
      address_extra: "",
    }),
    [quote, setQuote] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false);
  const { data } = useStore();
  const locationRequest = useRef(0);
  const selectLocation = async (lat: number, lng: number) => {
    const request = ++locationRequest.current;
    setForm((f) => ({
      ...f,
      latitude: lat.toFixed(7),
      longitude: lng.toFixed(7),
    }));
    setLocating(true);
    try {
      const place = await api("geocoding/reverse", {
        latitude: lat,
        longitude: lng,
      });
      if (request === locationRequest.current)
        setForm((f) => ({
          ...f,
          address: place.address,
          region: place.region,
        }));
    } catch (e: any) {
      if (request === locationRequest.current) setError(e.message);
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  };
  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ vị trí. Hãy nhập địa chỉ.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (p) => selectLocation(p.coords.latitude, p.coords.longitude),
      () => {
        setError(
          "Chưa được phép lấy vị trí. Bạn có thể bật quyền vị trí hoặc nhập địa chỉ.",
        );
        setLocating(false);
      },
      { timeout: 12000, enableHighAccuracy: true },
    );
  };
  const key = useRef(
    sessionStorage.getItem("od.checkout-key") || crypto.randomUUID(),
  );
  useEffect(() => {
    sessionStorage.setItem("od.checkout-key", key.current);
  }, []);
  useEffect(() => {
    if (data?.payment && !data.payment[form.payment_method])
      setForm((f) => ({
        ...f,
        payment_method: data.payment.cod ? "cod" : "bank",
      }));
  }, [data?.payment, form.payment_method]);
  const change = (k: string, v: any) => {
    if (k === "address") locationRequest.current++;
    setForm((f) => ({
      ...f,
      [k]: v,
      ...(["address", "region"].includes(k)
        ? { latitude: "", longitude: "", region: "" }
        : {}),
    }));
    if (k === "latitude" || k === "longitude") setQuote(null);
  };
  useEffect(() => {
    let active = true;
    setQuote(null);
    setError("");
    if (cart.length)
      api("quote", {
        items: cart,
        coupon,
        latitude: form.latitude,
        longitude: form.longitude,
      })
        .then((q) => {
          if (active) setQuote(q);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [cart, coupon, form.latitude, form.longitude]);
  if (!cart.length)
    return (
      <div className="container page">
        <Empty title="Chưa có sản phẩm để đặt">
          <Link to="/products">Khám phá sản phẩm</Link>
        </Empty>
      </div>
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api(
        "orders",
        {
          ...form,
          address: form.address,
          region: form.region || "Việt Nam",
          items: cart,
          coupon,
          quote_hash: quote?.quote_hash,
        },
        { "Idempotency-Key": key.current },
      );
      rememberOrder(r.order.code, r.token);
      setCart([]);
      setCoupon("");
      sessionStorage.removeItem("od.checkout-key");
      navigate("/order/" + r.token);
      setToast("Đã nhận đơn hàng của bạn");
    } catch (e: any) {
      setError(e.message);
      api("quote", {
        items: cart,
        coupon,
        latitude: form.latitude,
        longitude: form.longitude,
      })
        .then(setQuote)
        .catch(() => setQuote(null));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/cart">Giỏ hàng</Link>
        <ChevronRight size={13} />
        <span>Đặt hàng</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ĐẶT HÀNG</p>
          <h1>Giao đến đúng chỗ.</h1>
          <p>Đặt hàng nhanh, không cần tài khoản.</p>
        </div>
        <Lock size={24} strokeWidth={1.3} />
      </div>
      <form onSubmit={submit} className="checkout-grid">
        <div>
          <section className="panel">
            <h2>
              <span className="step-number">01</span> Thông tin nhận hàng
            </h2>
            <div className="form-grid">
              <Field label="Họ và tên *">
                <input
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder="Nguyễn Minh Anh"
                  maxLength={120}
                />
              </Field>
              <Field label="Số điện thoại *">
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => change("phone", e.target.value)}
                  placeholder="09xx xxx xxx"
                />
              </Field>
            </div>
            <Field label="Địa chỉ nhận hàng *">
              <AddressSearch
                value={form.address}
                region={form.region}
                selected={form.latitude !== "" && form.longitude !== ""}
                onChange={(v) => change("address", v)}
                onSelect={(place) => {
                  locationRequest.current++;
                  setQuote(null);
                  setForm((f) => ({
                    ...f,
                    address: place.label || place.address,
                    region: place.region || f.region,
                    latitude: place.latitude.toFixed(7),
                    longitude: place.longitude.toFixed(7),
                  }));
                }}
              />
            </Field>
            <div className="location-under-address">
              <Button
                type="button"
                variant="ghost"
                loading={locating}
                onClick={useLocation}
              >
                <Navigation size={17} /> Sử dụng vị trí hiện tại
              </Button>
              <small>
                Địa chỉ chưa đúng? Chạm bản đồ hoặc kéo ghim tới cửa nhà.
              </small>
            </div>
            <details
              className="checkout-map-details"
              open={form.latitude !== "" || undefined}
            >
              <summary>
                <MapPin size={16} /> Xem và chỉnh điểm nhận trên bản đồ
              </summary>
              <FreeMapPicker
                lat={form.latitude}
                lng={form.longitude}
                origin={data?.shipping}
                onChange={selectLocation}
              />
            </details>
            <div className="shipping-result" aria-live="polite">
              {quote?.distance_km != null ? (
                <>
                  <Truck size={19} />
                  <div>
                    <strong>
                      {quote.distance_km} km <span>quãng đường giao</span>
                    </strong>
                    <small>Phí tính theo quy tắc cửa hàng.</small>
                  </div>
                  <b>{money(quote.shipping_fee)}</b>
                </>
              ) : (
                <>
                  <MapPin size={19} />
                  <div>
                    <strong>
                      {form.latitude !== ""
                        ? "Cửa hàng cần xác nhận phí giao"
                        : "Chọn địa chỉ trên bản đồ"}
                    </strong>
                    <small>
                      {form.latitude !== ""
                        ? quote?.shipping_reason ||
                          "Đang lấy quãng đường và phí giao…"
                        : "Chọn gợi ý địa chỉ để tự tính quãng đường và phí giao."}
                    </small>
                  </div>
                </>
              )}
            </div>
            <details className="checkout-extra">
              <summary>Thêm ghi chú (không bắt buộc)</summary>
              <Field label="Ghi chú cho cửa hàng">
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => change("note", e.target.value)}
                  placeholder="Thời gian nhận hàng, hướng dẫn tìm địa chỉ…"
                  maxLength={1000}
                />
              </Field>
            </details>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">02</span> Phương thức thanh toán
            </h2>
            {[
              [
                "cod",
                "Tiền mặt khi nhận hàng",
                "Thanh toán cho người giao hàng.",
              ],
              [
                "bank",
                "Chuyển khoản ngân hàng",
                "Cửa hàng kiểm tra và xác nhận nhận tiền.",
              ],
            ]
              .filter(([key]) => data?.payment[key])
              .map(([key, title, desc]) => (
                <label
                  className={`payment-choice ${form.payment_method === key ? "active" : ""}`}
                  key={key}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={key}
                    checked={form.payment_method === key}
                    onChange={() => change("payment_method", key)}
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                </label>
              ))}
          </section>
        </div>
        <aside className="panel checkout-summary">
          <h2>
            Đơn hàng của bạn <Badge>{cart.length}</Badge>
          </h2>
          {quote?.items.map((i: Obj) => (
            <div className="mini-item" key={i.variant_id}>
              <img src={asset(i.image)} alt="" />
              <div>
                <strong>{i.product_name}</strong>
                <small>
                  {i.variant_name} · SL {i.quantity}
                </small>
              </div>
              <span>{money(i.unit_price * i.quantity)}</span>
            </div>
          ))}
          <div className="totals">
            <p>
              <span>Tiền hàng</span>
              <strong>{money(quote?.subtotal)}</strong>
            </p>
            <p>
              <span>Giảm giá {coupon}</span>
              <strong>−{money(quote?.discount || 0)}</strong>
            </p>
            <p>
              <span>Phí giao</span>
              <strong>{money(quote?.shipping_fee)}</strong>
            </p>
            <p className="grand-total">
              <span>Tổng thanh toán</span>
              <strong>{money(quote?.total)}</strong>
            </p>
          </div>
          {quote?.total === null && (
            <p className="muted small">
              Tiền hàng {money(quote.subtotal - quote.discount)} + phí giao đang
              chờ báo. Đơn chỉ được xử lý sau khi bạn xác nhận tổng.
            </p>
          )}
          <ErrorBox>{error}</ErrorBox>
          <Button variant="dark full" loading={busy} disabled={!quote}>
            Xác nhận đặt hàng <ArrowRight size={17} />
          </Button>
          <p className="secure-note">
            <Lock size={13} /> Thông tin chỉ dùng để xử lý đơn hàng.
          </p>
        </aside>
      </form>
    </div>
  );
}
export function Lookup() {
  return <PhoneLookup />;
}
export function Order() {
  const { token } = useParams();
  const [o, setO] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { setToast } = useStore();
  const load = () =>
    api("order/" + token)
      .then((order) => {
        rememberOrder(order.code, token!);
        setO(order);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [token]);
  const action = async (a: string) => {
    setBusy(true);
    try {
      setO(await api("order/" + token + "/" + a, {}));
      setToast("Đã gửi xác nhận");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!o)
    return (
      <div className="container page">
        {error ? <ErrorBox>{error}</ErrorBox> : <Loading />}
      </div>
    );
  const milestones = [
    "received",
    "confirmed",
    "preparing",
    "shipping",
    "delivered",
  ];
  const step = milestones.indexOf(o.status);
  const pay = o.payment_snapshot;
  const content = pay.transfer_template.replace("{code}", o.code);
  const qr =
    o.total != null
      ? `https://img.vietqr.io/image/${encodeURIComponent(pay.bank_bin)}-${encodeURIComponent(pay.bank_account)}-compact2.png?amount=${o.total}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(pay.bank_owner)}`
      : "";
  return (
    <div className="container page order-page">
      <div className="order-heading">
        <span className="order-success">
          <CheckCircle2 size={30} strokeWidth={1.4} />
        </span>
        <p className="eyebrow">CẢM ƠN BẠN ĐÃ CHỌN OD.</p>
        <h1>
          {o.status === "cancelled"
            ? "Đơn hàng đã huỷ."
            : "Đã nhận đơn của bạn."}
        </h1>
        <p>
          Mã đơn <strong>{o.code}</strong> · {date(o.created_at)}
        </p>
        <p className="muted small">
          Mã tra cứu riêng: <strong>{o.lookup_code}</strong>. Giữ link này để
          theo dõi; không chia sẻ công khai.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href);
              setToast("Đã sao chép link theo dõi");
            } catch {
              setToast("Hãy sao chép địa chỉ trang từ trình duyệt");
            }
          }}
        >
          Sao chép link theo dõi
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <div className="order-grid">
        <div>
          <section className="panel">
            <div className="panel-title">
              <h2>Tiến trình đơn hàng</h2>
              <Badge tone={o.status === "cancelled" ? "red" : "lime"}>
                {status[o.status]}
              </Badge>
            </div>
            {o.status === "cancelled" ? (
              <p className="error">
                Lý do: {o.cancel_reason}. Thanh toán/hoàn tiền được xử lý riêng.
              </p>
            ) : (
              <div className="timeline">
                {milestones.map((s, i) => (
                  <div key={s} className={i <= step ? "done" : ""}>
                    <span>{i <= step ? <Check size={14} /> : i + 1}</span>
                    <div>
                      <strong>{status[s]}</strong>
                      <small>
                        {o.history.find(
                          (h: Obj) =>
                            h.action ===
                            (
                              {
                                received: "received",
                                confirmed: "confirm",
                                preparing: "prepare",
                                shipping: "ship",
                                delivered: "deliver",
                              } as Obj
                            )[s],
                        )?.created_at &&
                          date(
                            o.history.find(
                              (h: Obj) =>
                                h.action ===
                                (
                                  {
                                    received: "received",
                                    confirmed: "confirm",
                                    preparing: "prepare",
                                    shipping: "ship",
                                    delivered: "deliver",
                                  } as Obj
                                )[s],
                            ).created_at,
                          )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          {o.shipping_status === "awaiting_customer" && (
            <section className="panel">
              <h2>Xác nhận phí giao hàng</h2>
              <p>
                Phí cửa hàng báo: <strong>{money(o.shipping_fee)}</strong>. Tổng
                đơn: <strong>{money(o.total)}</strong>.
              </p>
              <Button
                loading={busy}
                variant="lime"
                onClick={() => action("accept-shipping")}
              >
                Tôi đồng ý với tổng tiền này
              </Button>
            </section>
          )}
          <section className="panel">
            <h2>Thông tin nhận hàng</h2>
            <p>
              <strong>{o.customer_name}</strong> · {o.phone}
            </p>
            <p>
              {o.address}, {o.region}
            </p>
            {o.note && <p className="muted">Ghi chú: {o.note}</p>}
            <p className="muted">
              {o.distance_km
                ? `Quãng đường ${o.distance_km} km`
                : "Quãng đường chưa được xác định"}{" "}
              ·{" "}
              {o.shipping_status === "pending"
                ? "Cửa hàng đang xác nhận phí giao"
                : "Phí giao " + money(o.shipping_fee)}
            </p>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Thanh toán</h2>
              <Badge tone={o.payment_status === "paid" ? "lime" : ""}>
                {status[o.payment_status]}
              </Badge>
            </div>
            <p>
              {o.payment_method === "cod"
                ? "Tiền mặt khi nhận hàng"
                : "Chuyển khoản ngân hàng"}
            </p>
            {o.payment_method === "bank" &&
              o.shipping_status === "confirmed" &&
              o.status !== "cancelled" && (
                <>
                  {pay.demo && (
                    <ErrorBox>
                      DỮ LIỆU DEMO · QR minh hoạ. Không chuyển tiền. Chưa kết
                      nối ngân hàng.
                    </ErrorBox>
                  )}
                  <div className="bank-details">
                    <img
                      src={qr}
                      alt={
                        pay.demo
                          ? "QR minh hoạ, không chuyển tiền"
                          : "Mã QR chuyển khoản"
                      }
                    />
                    <div>
                      <p>Ngân hàng (BIN): {pay.bank_bin}</p>
                      <p>
                        STK: <strong>{pay.bank_account}</strong>
                      </p>
                      <p>{pay.bank_owner}</p>
                      <p>
                        Nội dung: <strong>{content}</strong>
                      </p>
                      <p>
                        Số tiền: <strong>{money(o.total)}</strong>
                      </p>
                    </div>
                  </div>
                  <p className="muted small">{pay.instructions}</p>
                  {o.payment_status === "pending" && (
                    <Button
                      loading={busy}
                      variant="dark"
                      onClick={() => action("review")}
                    >
                      Tôi đã chuyển khoản
                    </Button>
                  )}
                  <p className="muted small">
                    Nút này chỉ gửi yêu cầu kiểm tra. Cửa hàng xác nhận sau khi
                    thực nhận tiền.
                  </p>
                </>
              )}
          </section>
        </div>
        <div>
          <Receipt o={o} />
          <section className="panel">
            <h2>Lịch sử cập nhật</h2>
            {o.history.map((h: Obj, i: number) => (
              <div className="history-line" key={i}>
                <span>
                  {(
                    {
                      received: "Đã nhận đơn",
                      confirm: "Xác nhận đơn",
                      prepare: "Chuẩn bị hàng",
                      ship: "Bàn giao vận chuyển",
                      deliver: "Giao thành công",
                      paid: "Xác nhận nhận tiền",
                      cancel: "Huỷ đơn",
                      refund: "Xử lý hoàn/trả",
                      shipping_quote: "Cửa hàng báo phí giao",
                      shipping_accepted: "Đã chấp nhận phí giao",
                      payment_review: "Yêu cầu kiểm tra chuyển khoản",
                    } as Obj
                  )[h.action] || "Cập nhật đơn"}
                </span>
                <small>{date(h.created_at)}</small>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
export function Receipt({ o }: { o: Obj }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="panel receipt">
      <div className="panel-title">
        <div>
          <p className="eyebrow">{o.store_snapshot.name}</p>
          <h2>Phiếu bán hàng</h2>
        </div>
        <Package size={22} strokeWidth={1.3} />
      </div>
      <p className="muted small">
        {o.store_snapshot.address}
        <br />
        {o.code} · {date(o.created_at)}
        <br />
        {o.customer_name} · {o.phone}
        <br />
        {o.address}, {o.region}
      </p>
      {o.items.map((i: Obj) => (
        <div className="receipt-item" key={i.id}>
          <div>
            <strong>{i.product_name}</strong>
            <small>
              {i.variant_name} · {i.quantity} × {money(i.unit_price)}
            </small>
          </div>
          <span>{money(i.unit_price * i.quantity)}</span>
        </div>
      ))}
      <div className="totals">
        <p>
          <span>Tiền hàng</span>
          <strong>{money(o.subtotal)}</strong>
        </p>
        <p>
          <span>Giảm giá</span>
          <strong>−{money(o.discount)}</strong>
        </p>
        <p>
          <span>Phí giao</span>
          <strong>{money(o.shipping_fee)}</strong>
        </p>
        <p className="grand-total">
          <span>Tổng thanh toán</span>
          <strong>{money(o.total)}</strong>
        </p>
        <p>
          <span>Thanh toán</span>
          <Badge>{status[o.payment_status]}</Badge>
        </p>
        {Number(o.refunded_amount) > 0 && (
          <p>
            <span>Đã hoàn tiền</span>
            <span>{money(o.refunded_amount)}</span>
          </p>
        )}
      </div>
      <p className="muted small">
        Phiếu bán hàng, không phải hoá đơn điện tử.
        <br />
        Thông tin và giá được lưu tại thời điểm đặt đơn.
      </p>
      <div className="receipt-actions no-print">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> In phiếu
        </Button>
        <Button
          variant="outline"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await (await import("./pdf")).receiptPDF(o);
            } catch {
              setError(
                "Không tạo được PDF. Bạn có thể dùng In phiếu → Lưu PDF.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={16} /> Tải PDF
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
    </section>
  );
}
