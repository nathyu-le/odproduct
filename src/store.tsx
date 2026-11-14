import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Lock,
  MapPin,
  Minus,
  Navigation,
  Package,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api, asset, date, money, status, type Obj } from "./api";
import { CatalogueLayout } from "./catalogue-layout";
import { ProductCard } from "./catalogue-product";
import { useStore } from "./context";
import { tx } from "./i18n";
import { currentTime, displayProduct, useNow } from "./promotions";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  Loading,
  SectionTitle,
} from "./ui";

import { AddressSearch } from "./address-search";
import { FreeMapPicker } from "./free-map";
import { PhoneLookup, rememberOrder } from "./phone-lookup";
export function Layout() {
  return <CatalogueLayout renderCart={() => <CartContent drawer />} />;
}
export { CatalogueFlashPage as FlashSales } from "./catalogue-flash";
export { CatalogueHome as Home } from "./catalogue-home";
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
        <Link to="/">{tx("Trang chủ")}</Link>
        <ChevronRight size={13} />
        <span>{tx("Sản phẩm")}</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tx("SẢN PHẨM / OD. STORE")}</p>
          <h1>
            {params.get("sale")
              ? tx("Ưu đãi hôm nay")
              : tx("Chọn món bạn cần.")}
          </h1>
          <p>
            {tx(
              "Tai nghe, bàn phím, chuột, loa — theo cách bạn dùng mỗi ngày.",
            )}
          </p>
        </div>
        <span className="muted">
          {products.length}
          {tx(" sản phẩm")}
        </span>
      </div>
      <div className="catalog-tools">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder={tx("Tìm tai nghe, bàn phím, loa…")}
            aria-label={tx("Tìm kiếm sản phẩm")}
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
          <SlidersHorizontal size={17} />
          {tx(" Bộ lọc")}
        </Button>
        <select
          aria-label={tx("Sắp xếp sản phẩm")}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="selected">{tx("OD. đề xuất")}</option>
          <option value="price-asc">{tx("Giá tăng dần")}</option>
          <option value="price-desc">{tx("Giá giảm dần")}</option>
          <option value="newest">{tx("Mới nhất")}</option>
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
          {tx("Tất cả")}
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
          <Field label={tx("Giá tối đa: ") + money(max)}>
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
            {tx("Chỉ hiện sản phẩm còn hàng")}
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
            {tx("Xoá bộ lọc")}
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
        <Empty title={tx("Chưa tìm thấy sản phẩm")}>
          {tx("Thử đổi từ khoá hoặc điều chỉnh bộ lọc nhé.")}
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
      <Empty title={tx("Sản phẩm không còn được bán")}>
        {tx("Khám phá những lựa chọn khác trong cửa hàng.")}
      </Empty>
    );
  const v = p.variants[variant];
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link to="/">{tx("Trang chủ")}</Link>
        <ChevronRight size={13} />
        <Link to="/products">{tx("Sản phẩm")}</Link>
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
                aria-label={tx("Xem ảnh ") + (i + 1)}
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
          <Field label={tx("Phiên bản")}>
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
              ? tx("Sẵn hàng · {0} sản phẩm", [v.stock])
              : tx("Tạm hết hàng")}
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
              <ShoppingBag size={18} />
              {tx(" Thêm vào giỏ hàng")} <ArrowUpRight size={18} />
            </Button>
          </div>
          <div className="detail-promises">
            <p>
              <Truck size={18} />
              {tx(" Phí giao tính theo quãng đường thực tế")}
            </p>
            <p>
              <ShieldCheck size={18} />
              {tx(" Kiểm tra đơn và tổng tiền trước khi xác nhận")}
            </p>
            <p>
              <Lock size={18} />
              {tx(" Mua nhanh, không cần tài khoản")}
            </p>
          </div>
        </div>
      </div>
      <section className="section">
        <SectionTitle title={tx("Có thể bạn cũng thích")} />
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
      <button
        aria-label={tx("Giảm số lượng")}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={14} />
      </button>
      <span>{quantity}</span>
      <button
        aria-label={tx("Tăng số lượng")}
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
      <Empty title={tx("Giỏ hàng đang chờ bạn")} icon={<ShoppingBag />}>
        <span>{tx("Thêm một món đồ bạn thích để bắt đầu.")}</span>
        <Link
          className="button dark"
          to="/products"
          onClick={() => setCartOpen(false)}
        >
          {tx("Khám phá sản phẩm ")}
          <ArrowRight size={16} />
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
                <h3>{p?.name || tx("Sản phẩm đã ngừng bán")}</h3>
                <p>{v?.name}</p>
                <strong>{v ? money(v.price) : tx("Không khả dụng")}</strong>
                <Quantity
                  quantity={item.quantity}
                  max={Number(v?.stock || 99)}
                  onChange={(n) => update(item.variant_id, n)}
                />
              </div>
              <button
                className="icon-button"
                onClick={() => update(item.variant_id, 0)}
                aria-label={tx("Xoá sản phẩm")}
              >
                <Trash2 size={17} />
              </button>
            </div>
          );
        })}
      </div>
      <aside className="cart-summary">
        <h2>{tx("Tóm tắt đơn hàng")}</h2>
        <form
          className="coupon-form"
          onSubmit={(e) => {
            e.preventDefault();
            setCoupon(draft.trim());
          }}
        >
          <Tag size={17} />
          <input
            aria-label={tx("Mã giảm giá")}
            placeholder={tx("Mã giảm giá")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button>{tx("Áp dụng")}</button>
        </form>
        {coupon && (
          <button
            className="text-link"
            onClick={() => {
              setCoupon("");
              setDraft("");
            }}
          >
            {tx("Bỏ mã ")}
            {coupon} <X size={14} />
          </button>
        )}
        <ErrorBox>{error}</ErrorBox>
        <div className="totals">
          <p>
            <span>{tx("Tạm tính")}</span>
            <strong>{money(quote?.subtotal)}</strong>
          </p>
          <p>
            <span>{tx("Giảm giá")}</span>
            <strong>{money(quote?.discount || 0)}</strong>
          </p>
          <p>
            <span>{tx("Phí giao hàng")}</span>
            <span>{tx("Tính khi checkout")}</span>
          </p>
          <p className="grand-total">
            <span>{tx("Tiền hàng")}</span>
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
          {tx("Tiến hành đặt hàng ")}
          <ArrowRight size={17} />
        </Button>
        <p className="secure-note">
          <Lock size={13} />
          {tx(" Không cần đăng ký tài khoản")}
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
          <h1>{tx("Giỏ hàng của bạn.")}</h1>
        </div>
        <Link className="text-link" to="/products">
          {tx("Tiếp tục mua sắm ")}
          <ArrowRight size={16} />
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
      setError(tx("Trình duyệt không hỗ trợ vị trí. Hãy nhập địa chỉ."));
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (p) => selectLocation(p.coords.latitude, p.coords.longitude),
      () => {
        setError(
          tx(
            "Chưa được phép lấy vị trí. Bạn có thể bật quyền vị trí hoặc nhập địa chỉ.",
          ),
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
        <Empty title={tx("Chưa có sản phẩm để đặt")}>
          <Link to="/products">{tx("Khám phá sản phẩm")}</Link>
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
          region: form.region || tx("Việt Nam"),
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
      setToast(tx("Đã nhận đơn hàng của bạn"));
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
        <Link to="/cart">{tx("Giỏ hàng")}</Link>
        <ChevronRight size={13} />
        <span>{tx("Đặt hàng")}</span>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tx("ĐẶT HÀNG")}</p>
          <h1>{tx("Giao đến đúng chỗ.")}</h1>
          <p>{tx("Đặt hàng nhanh, không cần tài khoản.")}</p>
        </div>
        <Lock size={24} strokeWidth={1.3} />
      </div>
      <form onSubmit={submit} className="checkout-grid">
        <div>
          <section className="panel">
            <h2>
              <span className="step-number">01</span>
              {tx(" Thông tin nhận hàng")}
            </h2>
            <div className="form-grid">
              <Field label={tx("Họ và tên *")}>
                <input
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder={tx("Nguyễn Minh Anh")}
                  maxLength={120}
                />
              </Field>
              <Field label={tx("Số điện thoại *")}>
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
            <Field label={tx("Địa chỉ nhận hàng *")}>
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
                <Navigation size={17} />
                {tx(" Sử dụng vị trí hiện tại")}
              </Button>
              <small>
                {tx(
                  "Địa chỉ chưa đúng? Chạm bản đồ hoặc kéo ghim tới cửa nhà.",
                )}
              </small>
            </div>
            <details
              className="checkout-map-details"
              open={form.latitude !== "" || undefined}
            >
              <summary>
                <MapPin size={16} />
                {tx(" Xem và chỉnh điểm nhận trên bản đồ")}
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
                      {quote.distance_km} km{" "}
                      <span>{tx("quãng đường giao")}</span>
                    </strong>
                    <small>{tx("Phí tính theo quy tắc cửa hàng.")}</small>
                  </div>
                  <b>{money(quote.shipping_fee)}</b>
                </>
              ) : (
                <>
                  <MapPin size={19} />
                  <div>
                    <strong>
                      {form.latitude !== ""
                        ? tx("Cửa hàng cần xác nhận phí giao")
                        : tx("Chọn địa chỉ trên bản đồ")}
                    </strong>
                    <small>
                      {form.latitude !== ""
                        ? quote?.shipping_reason ||
                          tx("Đang lấy quãng đường và phí giao…")
                        : tx(
                            "Chọn gợi ý địa chỉ để tự tính quãng đường và phí giao.",
                          )}
                    </small>
                  </div>
                </>
              )}
            </div>
            <details className="checkout-extra">
              <summary>{tx("Thêm ghi chú (không bắt buộc)")}</summary>
              <Field label={tx("Ghi chú cho cửa hàng")}>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => change("note", e.target.value)}
                  placeholder={tx(
                    "Thời gian nhận hàng, hướng dẫn tìm địa chỉ…",
                  )}
                  maxLength={1000}
                />
              </Field>
            </details>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">02</span>
              {tx(" Phương thức thanh toán")}
            </h2>
            {[
              [
                "cod",
                tx("Tiền mặt khi nhận hàng"),
                tx("Thanh toán cho người giao hàng."),
              ],
              [
                "bank",
                tx("Chuyển khoản ngân hàng"),
                tx("Cửa hàng kiểm tra và xác nhận nhận tiền."),
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
            {tx("Đơn hàng của bạn ")}
            <Badge>{cart.length}</Badge>
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
              <span>{tx("Tiền hàng")}</span>
              <strong>{money(quote?.subtotal)}</strong>
            </p>
            <p>
              <span>
                {tx("Giảm giá ")}
                {coupon}
              </span>
              <strong>−{money(quote?.discount || 0)}</strong>
            </p>
            <p>
              <span>{tx("Phí giao")}</span>
              <strong>{money(quote?.shipping_fee)}</strong>
            </p>
            <p className="grand-total">
              <span>{tx("Tổng thanh toán")}</span>
              <strong>{money(quote?.total)}</strong>
            </p>
          </div>
          {quote?.total === null && (
            <p className="muted small">
              {tx("Tiền hàng ")}
              {money(quote.subtotal - quote.discount)}
              {tx(
                " + phí giao đang chờ báo. Đơn chỉ được xử lý sau khi bạn xác nhận tổng.",
              )}
            </p>
          )}
          <ErrorBox>{error}</ErrorBox>
          <Button variant="dark full" loading={busy} disabled={!quote}>
            {tx("Xác nhận đặt hàng ")}
            <ArrowRight size={17} />
          </Button>
          <p className="secure-note">
            <Lock size={13} />
            {tx(" Thông tin chỉ dùng để xử lý đơn hàng.")}
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
      setToast(tx("Đã gửi xác nhận"));
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
        <p className="eyebrow">{tx("CẢM ƠN BẠN ĐÃ CHỌN OD.")}</p>
        <h1>
          {o.status === "cancelled"
            ? tx("Đơn hàng đã huỷ.")
            : tx("Đã nhận đơn của bạn.")}
        </h1>
        <p>
          {tx("Mã đơn ")}
          <strong>{o.code}</strong> · {date(o.created_at)}
        </p>
        <p className="muted small">
          {tx("Mã tra cứu riêng: ")}
          <strong>{o.lookup_code}</strong>
          {tx(". Giữ link này để theo dõi; không chia sẻ công khai.")}
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href);
              setToast(tx("Đã sao chép link theo dõi"));
            } catch {
              setToast(tx("Hãy sao chép địa chỉ trang từ trình duyệt"));
            }
          }}
        >
          {tx("Sao chép link theo dõi")}
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <div className="order-grid">
        <div>
          <section className="panel">
            <div className="panel-title">
              <h2>{tx("Tiến trình đơn hàng")}</h2>
              <Badge tone={o.status === "cancelled" ? "red" : "lime"}>
                {status[o.status]}
              </Badge>
            </div>
            {o.status === "cancelled" ? (
              <p className="error">
                {tx("Lý do: ")}
                {o.cancel_reason}
                {tx(". Thanh toán/hoàn tiền được xử lý riêng.")}
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
              <h2>{tx("Xác nhận phí giao hàng")}</h2>
              <p>
                {tx("Phí cửa hàng báo: ")}
                <strong>{money(o.shipping_fee)}</strong>
                {tx(". Tổng đơn: ")}
                <strong>{money(o.total)}</strong>.
              </p>
              <Button
                loading={busy}
                variant="lime"
                onClick={() => action("accept-shipping")}
              >
                {tx("Tôi đồng ý với tổng tiền này")}
              </Button>
            </section>
          )}
          <section className="panel">
            <h2>{tx("Thông tin nhận hàng")}</h2>
            <p>
              <strong>{o.customer_name}</strong> · {o.phone}
            </p>
            <p>
              {o.address}, {o.region}
            </p>
            {o.note && (
              <p className="muted">
                {tx("Ghi chú: ")}
                {o.note}
              </p>
            )}
            <p className="muted">
              {o.distance_km
                ? tx("Quãng đường {0} km", [o.distance_km])
                : tx("Quãng đường chưa được xác định")}{" "}
              ·{" "}
              {o.shipping_status === "pending"
                ? tx("Cửa hàng đang xác nhận phí giao")
                : tx("Phí giao ") + money(o.shipping_fee)}
            </p>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h2>{tx("Thanh toán")}</h2>
              <Badge tone={o.payment_status === "paid" ? "lime" : ""}>
                {status[o.payment_status]}
              </Badge>
            </div>
            <p>
              {o.payment_method === "cod"
                ? tx("Tiền mặt khi nhận hàng")
                : tx("Chuyển khoản ngân hàng")}
            </p>
            {o.payment_method === "bank" &&
              o.shipping_status === "confirmed" &&
              o.status !== "cancelled" && (
                <>
                  {pay.demo && (
                    <ErrorBox>
                      {tx(
                        "DỮ LIỆU DEMO · QR minh hoạ. Không chuyển tiền. Chưa kết nối ngân hàng.",
                      )}
                    </ErrorBox>
                  )}
                  <div className="bank-details">
                    <img
                      src={qr}
                      alt={
                        pay.demo
                          ? tx("QR minh hoạ, không chuyển tiền")
                          : tx("Mã QR chuyển khoản")
                      }
                    />
                    <div>
                      <p>
                        {tx("Ngân hàng (BIN): ")}
                        {pay.bank_bin}
                      </p>
                      <p>
                        STK: <strong>{pay.bank_account}</strong>
                      </p>
                      <p>{pay.bank_owner}</p>
                      <p>
                        {tx("Nội dung: ")}
                        <strong>{content}</strong>
                      </p>
                      <p>
                        {tx("Số tiền: ")}
                        <strong>{money(o.total)}</strong>
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
                      {tx("Tôi đã chuyển khoản")}
                    </Button>
                  )}
                  <p className="muted small">
                    {tx(
                      "Nút này chỉ gửi yêu cầu kiểm tra. Cửa hàng xác nhận sau khi thực nhận tiền.",
                    )}
                  </p>
                </>
              )}
          </section>
        </div>
        <div>
          <Receipt o={o} />
          <section className="panel">
            <h2>{tx("Lịch sử cập nhật")}</h2>
            {o.history.map((h: Obj, i: number) => (
              <div className="history-line" key={i}>
                <span>
                  {(
                    {
                      received: tx("Đã nhận đơn"),
                      confirm: tx("Xác nhận đơn"),
                      prepare: tx("Chuẩn bị hàng"),
                      ship: tx("Bàn giao vận chuyển"),
                      deliver: tx("Giao thành công"),
                      paid: tx("Xác nhận nhận tiền"),
                      cancel: tx("Huỷ đơn"),
                      refund: tx("Xử lý hoàn/trả"),
                      shipping_quote: tx("Cửa hàng báo phí giao"),
                      shipping_accepted: tx("Đã chấp nhận phí giao"),
                      payment_review: tx("Yêu cầu kiểm tra chuyển khoản"),
                    } as Obj
                  )[h.action] || tx("Cập nhật đơn")}
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
          <h2>{tx("Phiếu bán hàng")}</h2>
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
              {i.variant_name} · {i.quantity}
              {tx(" × ")}
              {money(i.unit_price)}
            </small>
          </div>
          <span>{money(i.unit_price * i.quantity)}</span>
        </div>
      ))}
      <div className="totals">
        <p>
          <span>{tx("Tiền hàng")}</span>
          <strong>{money(o.subtotal)}</strong>
        </p>
        <p>
          <span>{tx("Giảm giá")}</span>
          <strong>−{money(o.discount)}</strong>
        </p>
        <p>
          <span>{tx("Phí giao")}</span>
          <strong>{money(o.shipping_fee)}</strong>
        </p>
        <p className="grand-total">
          <span>{tx("Tổng thanh toán")}</span>
          <strong>{money(o.total)}</strong>
        </p>
        <p>
          <span>{tx("Thanh toán")}</span>
          <Badge>{status[o.payment_status]}</Badge>
        </p>
        {Number(o.refunded_amount) > 0 && (
          <p>
            <span>{tx("Đã hoàn tiền")}</span>
            <span>{money(o.refunded_amount)}</span>
          </p>
        )}
      </div>
      <p className="muted small">
        {tx("Phiếu bán hàng, không phải hoá đơn điện tử.")}
        <br />
        {tx("Thông tin và giá được lưu tại thời điểm đặt đơn.")}
      </p>
      <div className="receipt-actions no-print">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} />
          {tx(" In phiếu")}
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
                tx("Không tạo được PDF. Bạn có thể dùng In phiếu → Lưu PDF."),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={16} />
          {tx(" Tải PDF")}
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
    </section>
  );
}
