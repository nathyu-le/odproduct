import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { api, asset, money, date, status, type Obj } from './api';
import { useStore } from './context';
import { Button, Empty, Loading, Field, Modal, Badge, SectionTitle, ErrorBox } from './ui';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
    [q, setQ] = useState('');
  const nav = useNavigate();
  return (
    <>
      <div className="announcement">
        <span>{data?.store?.banner || 'CHỌN ĐỒ HAY. TẬN HƯỞNG MỖI NGÀY.'}</span>
        <Link to="/products">
          Khám phá bộ sưu tập <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="OD Store trang chủ">
            od<span>.</span>
          </Link>
          <nav className={menu ? 'main-nav open' : 'main-nav'}>
            <NavLink to="/" end onClick={() => setMenu(false)}>
              Trang chủ
            </NavLink>
            <NavLink to="/products" onClick={() => setMenu(false)}>
              Sản phẩm
            </NavLink>
            <Link to="/products?sale=1" onClick={() => setMenu(false)}>
              Ưu đãi <span className="nav-dot" />
            </Link>
            <NavLink to="/lookup" onClick={() => setMenu(false)}>
              Tra cứu đơn
            </NavLink>
          </nav>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              nav('/products?q=' + encodeURIComponent(q));
            }}
          >
            <Search size={17} />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Bạn đang tìm gì?"
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
            aria-label="Mở menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        {error && !data ? (
          <div className="container">
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
              <h3>Công nghệ, vừa vặn với bạn.</h3>
              <p>Những lựa chọn nhỏ. Một trải nghiệm tốt hơn.</p>
            </div>
            <div>
              <h4>Khám phá</h4>
              <Link to="/products">Tất cả sản phẩm</Link>
              <Link to="/products?sale=1">Ưu đãi hôm nay</Link>
              <Link to="/lookup">Theo dõi đơn hàng</Link>
            </div>
            <div>
              <h4>Luôn sẵn sàng hỗ trợ</h4>
              <a href={'tel:' + data?.store?.phone}>{data?.store?.phone || 'Liên hệ cửa hàng'}</a>
              <a href={'mailto:' + data?.store?.email}>{data?.store?.email}</a>
              <p>{data?.store?.address}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} OD. Store. Chăm chút từng trải nghiệm.</span>
            <span>
              Thiết kế cho cuộc sống mỗi ngày <span className="lime-dot" />
            </span>
            <Link to="/admin">Quản trị</Link>
          </div>
        </div>
      </footer>
      {cartOpen && (
        <Modal title="Giỏ hàng của bạn" onClose={() => setCartOpen(false)}>
          <CartContent drawer />
        </Modal>
      )}
    </>
  );
}
function ProductCard({ p }: { p: Obj }) {
  const { add } = useStore();
  const [liked, setLiked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('od.favs') || '[]').includes(p.id);
    } catch {
      return false;
    }
  });
  const sale =
    p.flash_price &&
    new Date(p.flash_start.replace(' ', 'T') + '+07:00') <= new Date() &&
    new Date(p.flash_end.replace(' ', 'T') + '+07:00') > new Date() &&
    new Date(p.flash_start.replace(' ', 'T') + '+07:00') <= new Date();
  const stock = p.variants.reduce((s: number, v: Obj) => s + Number(v.stock), 0);
  const toggle = () => {
    let f = [];
    try {
      f = JSON.parse(localStorage.getItem('od.favs') || '[]');
    } catch {}
    localStorage.setItem(
      'od.favs',
      JSON.stringify(liked ? f.filter((id: any) => id !== p.id) : [...f, p.id]),
    );
    setLiked(!liked);
  };
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={'/product/' + p.slug}>
          <img src={asset(p.images[0])} alt={p.name} loading="lazy" />
        </Link>
        <div className="product-badges">
          {!stock ? (
            <Badge>Hết hàng</Badge>
          ) : sale ? (
            <Badge tone="lime">Flash sale</Badge>
          ) : p.pinned == 1 ? (
            <Badge>OD. chọn lọc</Badge>
          ) : null}
        </div>
        <button
          className={`favorite ${liked ? 'selected' : ''}`}
          onClick={toggle}
          aria-label={liked ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
          aria-pressed={liked}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <span className="product-brand">{p.brand}</span>
        <Link to={'/product/' + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <p>{p.variants[0]?.name}</p>
        <div className="product-bottom">
          <div>
            <strong>{money(p.price)}</strong>
            {sale && <del>{money(p.variants[0]?.compare_price)}</del>}
          </div>
          <button
            className="add-button"
            disabled={!stock}
            aria-label={'Thêm ' + p.name}
            onClick={() => {
              if (p.variants.length > 1) location.hash = '/product/' + p.slug;
              else add(Number(p.variants[0].id));
            }}
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Home() {
  const { data } = useStore();
  if (!data) return <Loading />;
  const products = data.products;
  const hero = products.find((p: Obj) => p.slug === 'studio-h1') || products[0];
  const sale = products.filter(
    (p: Obj) =>
      p.flash_price &&
      new Date(p.flash_start.replace(' ', 'T') + '+07:00') <= new Date() &&
      new Date(p.flash_end.replace(' ', 'T') + '+07:00') > new Date(),
  );
  return (
    <>
      <div className="container">
        <div className="home-kicker">
          <span>
            <span className="lime-dot" /> TINH GỌN CHO MỖI NGÀY
          </span>
          <span>Curated tech. Better everyday.</span>
        </div>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-square" /> ESSENTIALS COLLECTION / 2026
            </span>
            <h1>
              {data.store.hero_title.split(/\\n|\n/).map((t: string, i: number) => (
                <span key={i}>
                  {t}
                  <br />
                </span>
              ))}
            </h1>
            <p>{data.store.hero_subtitle}</p>
            <Link className="button dark" to="/products">
              Khám phá ngay <ArrowUpRight size={18} />
            </Link>
            <div className="hero-note">
              <span className="line" /> Ít hơn, nhưng tốt hơn.
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={asset('images/headphones.jpg')}
              alt="Tai nghe Studio H1 với thiết kế tối giản"
            />
            <span className="hero-label">ÂM THANH CHO KHOẢNG RIÊNG CỦA BẠN</span>
            <Link className="floating-product" to={hero ? '/product/' + hero.slug : '/products'}>
              <div>
                <small>MEET YOUR NEW EVERYDAY</small>
                <strong>{hero?.name || 'Khám phá bộ sưu tập'}</strong>
                {hero && <span>{money(hero.price)}</span>}
              </div>
              <span className="floating-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>
            <span className="slide-index">
              01 <span>/ ESSENTIALS</span>
            </span>
          </div>
        </section>
        <div className="trust-strip">
          <span>
            <Truck /> Giao hàng theo khoảng cách
          </span>
          <span>
            <ShieldCheck /> Sản phẩm được chọn lọc
          </span>
          <span>
            <RotateCcw /> Hỗ trợ sau mua tận tâm
          </span>
        </div>
        <section className="section categories-section">
          <SectionTitle eyebrow="TÌM ĐIỀU BẠN CẦN" title="Một góc riêng. Đủ mọi thứ.">
            <Link className="text-link" to="/products">
              Tất cả danh mục <ArrowRight size={16} />
            </Link>
          </SectionTitle>
          <div className="category-grid">
            {data.categories.map((c: Obj) => {
              const Icon = icons[c.icon] || Cable;
              return (
                <Link className="category-card" key={c.id} to={'/products?category=' + c.slug}>
                  <div className="category-icon">
                    <Icon strokeWidth={1.4} />
                  </div>
                  <span>{c.name}</span>
                  <ArrowUpRight size={15} />
                </Link>
              );
            })}
          </div>
        </section>
        <section className="section">
          <SectionTitle eyebrow="OD. SELECTED" title="Những lựa chọn đáng có.">
            <Link className="text-link" to="/products">
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </SectionTitle>
          <div className="product-grid">
            {products
              .filter((p: Obj) => Number(p.featured) || Number(p.pinned))
              .slice(0, 8)
              .map((p: Obj) => (
                <ProductCard key={p.id} p={p} />
              ))}
          </div>
        </section>
        <section className="editorial-banner">
          <div>
            <span className="eyebrow">YOUR SPACE. YOUR PACE.</span>
            <h2>
              Một chút thay đổi.
              <br />
              Nhiều cảm hứng hơn.
            </h2>
            <p>Tạo nên góc làm việc mang dấu ấn của riêng bạn.</p>
            <Link to="/products?category=ban-phim" className="button light">
              Nâng cấp góc làm việc <ArrowUpRight size={17} />
            </Link>
          </div>
          <img
            loading="lazy"
            src={asset('images/desk.jpg')}
            alt="Góc làm việc tối giản với ánh sáng tự nhiên"
          />
        </section>
        {sale.length > 0 && (
          <section className="section">
            <SectionTitle eyebrow="GOOD THINGS, BETTER PRICES" title="Đúng món. Đúng thời điểm.">
              <Countdown end={sale[0].flash_end} />
            </SectionTitle>
            <div className="product-grid">
              {sale.map((p: Obj) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
        <section className="brand-message">
          <span className="tiny-square" />
          <p>
            Không cần quá nhiều.
            <br />
            Chỉ cần <span>đúng thứ bạn yêu.</span>
          </p>
          <Link to="/products" className="text-link">
            Khám phá thế giới OD. <ArrowUpRight size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}
function Countdown({ end }: { end: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () =>
      setLeft(Math.max(0, new Date(end.replace(' ', 'T') + '+07:00').getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  return (
    <div className="countdown">
      <Clock size={15} />
      <span>Kết thúc sau</span>
      {[
        Math.floor(left / 3600000),
        Math.floor(left / 60000) % 60,
        Math.floor(left / 1000) % 60,
      ].map((n, i) => (
        <b key={i}>{String(n).padStart(2, '0')}</b>
      ))}
    </div>
  );
}
export function Catalog() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || ''),
    [sort, setSort] = useState('selected'),
    [inStock, setInStock] = useState(false),
    [max, setMax] = useState(3000000),
    [filter, setFilter] = useState(false);
  useEffect(() => setQ(params.get('q') || ''), [params]);
  if (!data) return <Loading />;
  const cat = params.get('category') || '';
  let products = data.products.filter(
    (p: Obj) =>
      (!cat || p.category_slug === cat) &&
      (!params.get('sale') ||
        (p.flash_price &&
          new Date(p.flash_start.replace(' ', 'T') + '+07:00') <= new Date() &&
          new Date(p.flash_end.replace(' ', 'T') + '+07:00') > new Date())) &&
      (!q ||
        `${p.name} ${p.brand} ${p.description}`
          .toLocaleLowerCase('vi')
          .includes(q.toLocaleLowerCase('vi'))) &&
      p.price <= max &&
      (!inStock || p.variants.some((v: Obj) => v.stock > 0)),
  );
  if (sort === 'price-asc') products = [...products].sort((a: Obj, b: Obj) => a.price - b.price);
  if (sort === 'price-desc') products = [...products].sort((a: Obj, b: Obj) => b.price - a.price);
  if (sort === 'newest') products = [...products].sort((a: Obj, b: Obj) => b.id - a.id);
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} />
        <span>Sản phẩm</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FIND YOUR EVERYDAY</p>
          <h1>{params.get('sale') ? 'Ưu đãi hôm nay' : 'Những món đồ đáng có.'}</h1>
          <p>Chọn lọc kỹ lưỡng, dành cho cách bạn sống và làm việc.</p>
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
              p.set('q', e.target.value);
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
          className={!cat ? 'active' : ''}
          onClick={() => {
            const p = new URLSearchParams(params);
            p.delete('category');
            setParams(p);
          }}
        >
          Tất cả
        </button>
        {data.categories.map((c: Obj) => (
          <button
            key={c.id}
            className={cat === c.slug ? 'active' : ''}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set('category', c.slug);
              setParams(p);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      {filter && (
        <div className="filter-panel">
          <Field label={'Giá tối đa: ' + money(max)}>
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
            />{' '}
            Chỉ hiện sản phẩm còn hàng
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setMax(3000000);
              setInStock(false);
              setParams({});
              setQ('');
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
        <Empty title="Chưa tìm thấy sản phẩm">Thử đổi từ khoá hoặc điều chỉnh bộ lọc nhé.</Empty>
      )}
    </div>
  );
}
export function Product() {
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
  const p = data.products.find((x: Obj) => x.slug === slug);
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
                className={i === image ? 'active' : ''}
                onClick={() => setImage(i)}
                aria-label={'Xem ảnh ' + (i + 1)}
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
                  className={variant === i ? 'active' : ''}
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
            <span className={Number(v?.stock) > 0 ? 'lime-dot' : 'grey-dot'} />
            {Number(v?.stock) > 0 ? `Sẵn hàng · ${v.stock} sản phẩm` : 'Tạm hết hàng'}
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
              <ShoppingBag size={18} /> Thêm vào giỏ hàng <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="detail-promises">
            <p>
              <Truck size={18} /> Phí giao tính theo quãng đường thực tế
            </p>
            <p>
              <ShieldCheck size={18} /> Kiểm tra đơn và tổng tiền trước khi xác nhận
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
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (cart.length) {
      setBusy(true);
      api('quote', { items: cart, coupon })
        .then((q) => {
          setQuote(q);
          setError('');
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
        <Link className="button dark" to="/products" onClick={() => setCartOpen(false)}>
          Khám phá sản phẩm <ArrowRight size={16} />
        </Link>
      </Empty>
    );
  return (
    <div className={drawer ? 'cart-content drawer' : 'cart-content'}>
      <div className="cart-items">
        {cart.map((item: Obj) => {
          const p = data?.products.find((x: Obj) =>
            x.variants.some((v: Obj) => Number(v.id) === item.variant_id),
          );
          const v = p?.variants.find((x: Obj) => Number(x.id) === item.variant_id);
          return (
            <div className="cart-line" key={item.variant_id}>
              {p && <img src={asset(p.images[0])} alt={p.name} />}
              <div className="cart-line-info">
                <h3>{p?.name || 'Sản phẩm đã ngừng bán'}</h3>
                <p>{v?.name}</p>
                <strong>{v ? money(v.price) : 'Không khả dụng'}</strong>
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
              setCoupon('');
              setDraft('');
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
            <strong>{quote ? money(quote.subtotal - quote.discount) : '—'}</strong>
          </p>
        </div>
        <Button
          loading={busy}
          disabled={!quote || !!error}
          variant="dark full"
          onClick={() => {
            setCartOpen(false);
            navigate('/checkout');
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
function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: any;
  lng: any;
  onChange: (lat: number, lng: number) => void;
}) {
  const node = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    marker = useRef<L.CircleMarker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (!node.current) return;
    const m = L.map(node.current).setView([10.7798, 106.699], 13);
    map.current = m;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => cb.current(e.latlng.lat, e.latlng.lng));
    setTimeout(() => m.invalidateSize(), 100);
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (map.current && lat && lng) {
      marker.current?.remove();
      marker.current = L.circleMarker([Number(lat), Number(lng)], {
        radius: 9,
        color: '#252a24',
        fillColor: '#c5f36a',
        fillOpacity: 1,
        weight: 3,
      }).addTo(map.current);
      map.current.panTo([Number(lat), Number(lng)]);
    }
  }, [lat, lng]);
  return (
    <div className="map" ref={node} aria-label="Bản đồ chọn điểm nhận hàng, chạm để ghim vị trí" />
  );
}
export function Checkout() {
  const { cart, coupon, setCart, setCoupon, setToast } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<Obj>({
      name: '',
      phone: '',
      address: '',
      region: '',
      note: '',
      latitude: '',
      longitude: '',
      payment_method: 'cod',
    }),
    [quote, setQuote] = useState<Obj | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false);
  const { data } = useStore();
  const key = useRef(sessionStorage.getItem('od.checkout-key') || crypto.randomUUID());
  useEffect(() => {
    sessionStorage.setItem('od.checkout-key', key.current);
  }, []);
  useEffect(() => {
    if (data?.payment && !data.payment[form.payment_method])
      setForm((f) => ({ ...f, payment_method: data.payment.cod ? 'cod' : 'bank' }));
  }, [data?.payment, form.payment_method]);
  const change = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === 'latitude' || k === 'longitude') setQuote(null);
  };
  useEffect(() => {
    let active = true;
    setQuote(null);
    setError('');
    if (cart.length)
      api('quote', { items: cart, coupon, latitude: form.latitude, longitude: form.longitude })
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
    setError('');
    try {
      const r = await api(
        'orders',
        { ...form, items: cart, coupon, quote_hash: quote?.quote_hash },
        { 'Idempotency-Key': key.current },
      );
      setCart([]);
      setCoupon('');
      sessionStorage.removeItem('od.checkout-key');
      navigate('/order/' + r.token);
      setToast('Đã nhận đơn hàng của bạn');
    } catch (e: any) {
      setError(e.message);
      api('quote', { items: cart, coupon, latitude: form.latitude, longitude: form.longitude })
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
          <p className="eyebrow">ALMOST YOURS</p>
          <h1>Thêm một bước. Đến tay bạn.</h1>
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
                  onChange={(e) => change('name', e.target.value)}
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
                  onChange={(e) => change('phone', e.target.value)}
                  placeholder="09xx xxx xxx"
                />
              </Field>
              <Field label="Tỉnh/thành phố · Phường/xã *">
                <input
                  required
                  autoComplete="address-level1"
                  value={form.region}
                  onChange={(e) => change('region', e.target.value)}
                  placeholder="TP. Hồ Chí Minh, Phường Sài Gòn"
                  maxLength={180}
                />
              </Field>
              <Field label="Số nhà, đường, toà nhà *">
                <input
                  required
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => change('address', e.target.value)}
                  placeholder="Địa chỉ nhận hàng chi tiết"
                  maxLength={500}
                />
              </Field>
            </div>
            <Field label="Ghi chú cho cửa hàng">
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => change('note', e.target.value)}
                placeholder="Thời gian nhận hàng, hướng dẫn tìm địa chỉ…"
                maxLength={1000}
              />
            </Field>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">02</span> Vị trí & phí giao hàng
            </h2>
            <p className="muted">
              Chạm bản đồ để chọn điểm nhận, nhập tọa độ hoặc dùng vị trí hiện tại. Phí được tính
              theo quãng đường xe chạy.
            </p>
            <LocationPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) =>
                setForm((f) => ({ ...f, latitude: lat.toFixed(7), longitude: lng.toFixed(7) }))
              }
            />
            <div className="form-grid">
              <Field label="Vĩ độ">
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={(e) => change('latitude', e.target.value)}
                />
              </Field>
              <Field label="Kinh độ">
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={(e) => change('longitude', e.target.value)}
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              loading={locating}
              onClick={() => {
                setLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    setForm((f) => ({
                      ...f,
                      latitude: p.coords.latitude.toFixed(7),
                      longitude: p.coords.longitude.toFixed(7),
                    }));
                    setLocating(false);
                  },
                  () => {
                    setError('Không lấy được vị trí. Chọn trên bản đồ hoặc nhập tọa độ.');
                    setLocating(false);
                  },
                  { timeout: 10000 },
                );
              }}
            >
              <Navigation size={16} /> Dùng vị trí hiện tại
            </Button>
            <div className="notice">
              <MapPin size={18} />
              <div>
                {quote?.distance_km != null ? (
                  <>
                    <strong>
                      {quote.distance_km} km · {money(quote.shipping_fee)}
                    </strong>
                    <p>
                      Làm tròn phần km vượt mức:{' '}
                      {data?.shipping.round_mode === 'ceil'
                        ? 'lên'
                        : data?.shipping.round_mode === 'exact'
                          ? 'chính xác'
                          : 'gần nhất'}
                      , bước {data?.shipping.round_step} km.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>Cần xác nhận phí giao hàng</strong>
                    <p>
                      Cửa hàng sẽ báo phí. Bạn cần xác nhận tổng tiền trên trang đơn trước khi thanh
                      toán và xử lý.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">03</span> Phương thức thanh toán
            </h2>
            {[
              ['cod', 'Tiền mặt khi nhận hàng', 'Thanh toán cho người giao hàng.'],
              ['bank', 'Chuyển khoản ngân hàng', 'Cửa hàng kiểm tra và xác nhận nhận tiền.'],
            ]
              .filter(([key]) => data?.payment[key])
              .map(([key, title, desc]) => (
                <label
                  className={`payment-choice ${form.payment_method === key ? 'active' : ''}`}
                  key={key}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={key}
                    checked={form.payment_method === key}
                    onChange={() => change('payment_method', key)}
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
              Tiền hàng {money(quote.subtotal - quote.discount)} + phí giao đang chờ báo. Đơn chỉ
              được xử lý sau khi bạn xác nhận tổng.
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
  const [code, setCode] = useState(''),
    [phone, setPhone] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="container page narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WE'RE ON THE WAY</p>
          <h1>Đơn hàng của bạn ở đâu?</h1>
          <p>Dùng mã tra cứu riêng và số điện thoại đã đặt hàng.</p>
        </div>
      </div>
      <form
        className="panel stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            const r = await api('lookup', { code, phone });
            navigate('/order/' + r.token);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Mã tra cứu riêng">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="12 ký tự trong trang xác nhận đơn"
            autoComplete="off"
            maxLength={24}
          />
        </Field>
        <Field label="Số điện thoại đặt hàng">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxx"
          />
        </Field>
        <ErrorBox>{error}</ErrorBox>
        <Button variant="dark" loading={busy}>
          <Search size={17} /> Tra cứu đơn hàng
        </Button>
        <p className="muted small">
          Mã tra cứu khác với mã đơn OD. Nếu làm mất link theo dõi, vui lòng liên hệ cửa hàng.
        </p>
      </form>
    </div>
  );
}
export function Order() {
  const { token } = useParams();
  const [o, setO] = useState<Obj | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const { setToast } = useStore();
  const load = () =>
    api('order/' + token)
      .then(setO)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [token]);
  const action = async (a: string) => {
    setBusy(true);
    try {
      setO(await api('order/' + token + '/' + a, {}));
      setToast('Đã gửi xác nhận');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!o)
    return (
      <div className="container page">{error ? <ErrorBox>{error}</ErrorBox> : <Loading />}</div>
    );
  const milestones = ['received', 'confirmed', 'preparing', 'shipping', 'delivered'];
  const step = milestones.indexOf(o.status);
  const pay = o.payment_snapshot;
  const content = pay.transfer_template.replace('{code}', o.code);
  const qr =
    o.total != null
      ? `https://img.vietqr.io/image/${encodeURIComponent(pay.bank_bin)}-${encodeURIComponent(pay.bank_account)}-compact2.png?amount=${o.total}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(pay.bank_owner)}`
      : '';
  return (
    <div className="container page order-page">
      <div className="order-heading">
        <span className="order-success">
          <CheckCircle2 size={30} strokeWidth={1.4} />
        </span>
        <p className="eyebrow">CẢM ƠN BẠN ĐÃ CHỌN OD.</p>
        <h1>{o.status === 'cancelled' ? 'Đơn hàng đã huỷ.' : 'Đã nhận đơn của bạn.'}</h1>
        <p>
          Mã đơn <strong>{o.code}</strong> · {date(o.created_at)}
        </p>
        <p className="muted small">
          Mã tra cứu riêng: <strong>{o.lookup_code}</strong>. Giữ link này để theo dõi; không chia
          sẻ công khai.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href);
              setToast('Đã sao chép link theo dõi');
            } catch {
              setToast('Hãy sao chép địa chỉ trang từ trình duyệt');
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
              <Badge tone={o.status === 'cancelled' ? 'red' : 'lime'}>{status[o.status]}</Badge>
            </div>
            {o.status === 'cancelled' ? (
              <p className="error">
                Lý do: {o.cancel_reason}. Thanh toán/hoàn tiền được xử lý riêng.
              </p>
            ) : (
              <div className="timeline">
                {milestones.map((s, i) => (
                  <div key={s} className={i <= step ? 'done' : ''}>
                    <span>{i <= step ? <Check size={14} /> : i + 1}</span>
                    <div>
                      <strong>{status[s]}</strong>
                      <small>
                        {o.history.find(
                          (h: Obj) =>
                            h.action ===
                            (
                              {
                                received: 'received',
                                confirmed: 'confirm',
                                preparing: 'prepare',
                                shipping: 'ship',
                                delivered: 'deliver',
                              } as Obj
                            )[s],
                        )?.created_at &&
                          date(
                            o.history.find(
                              (h: Obj) =>
                                h.action ===
                                (
                                  {
                                    received: 'received',
                                    confirmed: 'confirm',
                                    preparing: 'prepare',
                                    shipping: 'ship',
                                    delivered: 'deliver',
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
          {o.shipping_status === 'awaiting_customer' && (
            <section className="panel">
              <h2>Xác nhận phí giao hàng</h2>
              <p>
                Phí cửa hàng báo: <strong>{money(o.shipping_fee)}</strong>. Tổng đơn:{' '}
                <strong>{money(o.total)}</strong>.
              </p>
              <Button loading={busy} variant="lime" onClick={() => action('accept-shipping')}>
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
              {o.distance_km ? `Quãng đường ${o.distance_km} km` : 'Quãng đường chưa được xác định'}{' '}
              ·{' '}
              {o.shipping_status === 'pending'
                ? 'Cửa hàng đang xác nhận phí giao'
                : 'Phí giao ' + money(o.shipping_fee)}
            </p>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>Thanh toán</h2>
              <Badge tone={o.payment_status === 'paid' ? 'lime' : ''}>
                {status[o.payment_status]}
              </Badge>
            </div>
            <p>
              {o.payment_method === 'cod' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}
            </p>
            {o.payment_method === 'bank' &&
              o.shipping_status === 'confirmed' &&
              o.status !== 'cancelled' && (
                <>
                  {pay.demo && (
                    <ErrorBox>
                      DỮ LIỆU DEMO · QR minh hoạ. Không chuyển tiền. Chưa kết nối ngân hàng.
                    </ErrorBox>
                  )}
                  <div className="bank-details">
                    <img
                      src={qr}
                      alt={pay.demo ? 'QR minh hoạ, không chuyển tiền' : 'Mã QR chuyển khoản'}
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
                  {o.payment_status === 'pending' && (
                    <Button loading={busy} variant="dark" onClick={() => action('review')}>
                      Tôi đã chuyển khoản
                    </Button>
                  )}
                  <p className="muted small">
                    Nút này chỉ gửi yêu cầu kiểm tra. Cửa hàng xác nhận sau khi thực nhận tiền.
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
                      received: 'Đã nhận đơn',
                      confirm: 'Xác nhận đơn',
                      prepare: 'Chuẩn bị hàng',
                      ship: 'Bàn giao vận chuyển',
                      deliver: 'Giao thành công',
                      paid: 'Xác nhận nhận tiền',
                      cancel: 'Huỷ đơn',
                      refund: 'Xử lý hoàn/trả',
                      shipping_quote: 'Cửa hàng báo phí giao',
                      shipping_accepted: 'Đã chấp nhận phí giao',
                      payment_review: 'Yêu cầu kiểm tra chuyển khoản',
                    } as Obj
                  )[h.action] || 'Cập nhật đơn'}
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
    [error, setError] = useState('');
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
              await (await import('./pdf')).receiptPDF(o);
            } catch {
              setError('Không tạo được PDF. Bạn có thể dùng In phiếu → Lưu PDF.');
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
