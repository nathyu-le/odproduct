import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Menu,
  X,
  Zap,
  House,
  Grid2X2,
  Package,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { useStore } from "./context";
import { Modal, ErrorBox, Button } from "./ui";
import { useNow, saleState } from "./promotions";
import type { Obj } from "./api";
export function CatalogueLayout({
  renderCart,
}: {
  renderCart: () => ReactNode;
}) {
  const { data, error, count, setCartOpen, cartOpen } = useStore();
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuNav = useRef<HTMLElement>(null);
  const now = useNow();
  const active = (data?.products || []).filter(
    (p: Obj) => saleState(p, now) === "active",
  ).length;
  useEffect(() => {
    if (!menu) return;
    if (matchMedia("(max-width: 1100px)").matches)
      menuNav.current?.querySelector("a")?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);
  return (
    <div className="catalogue-store">
      <button
        className="cx-skip"
        onClick={() => {
          document.getElementById("store-content")?.focus();
        }}
      >
        Đến nội dung chính
      </button>
      <div className="cx-announcement">
        <div className="container">
          <span>
            {data?.store?.banner || "Phụ kiện công nghệ, chọn vừa nhu cầu."}
          </span>
          <Link to="/flash-sale">
            <Zap size={13} />
            {active ? "Flash sale đang mở" : "Lịch flash sale"}
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <header
        className="cx-header"
        onBlur={(e) => {
          if (
            menu &&
            e.relatedTarget &&
            !e.currentTarget.contains(e.relatedTarget as Node)
          )
            setMenu(false);
        }}
      >
        <div className="container cx-header-inner">
          <Link to="/" className="cx-logo" aria-label="OD Store — trang chủ">
            od<span>.</span>
          </Link>
          <nav
            ref={menuNav}
            id="cx-navigation"
            className={"cx-navigation" + (menu ? " is-open" : "")}
            aria-label="Điều hướng cửa hàng"
          >
            {[
              ["/", "Trang chủ"],
              ["/products", "Sản phẩm"],
              ["/flash-sale", "Flash sale"],
              ["/lookup", "Tra cứu đơn"],
            ].map(([path, label]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={() => setMenu(false)}
              >
                {path === "/flash-sale" && <Zap size={15} />} {label}
                {path === "/flash-sale" && active > 0 && (
                  <span className="cx-nav-count">{active}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <form
            className="cx-search"
            action="#/products"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                "q",
              ) as HTMLInputElement;
              location.hash =
                "/products?q=" + encodeURIComponent(input.value.trim());
              setMenu(false);
            }}
          >
            <Search size={18} />
            <input
              name="q"
              type="search"
              aria-label="Tìm sản phẩm"
              placeholder="Tìm tai nghe, bàn phím…"
              autoComplete="off"
            />
            <button type="submit" aria-label="Tìm kiếm">
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="cx-cart"
            onClick={() => setCartOpen(true)}
            aria-label={`Mở giỏ hàng, ${count} sản phẩm`}
          >
            <ShoppingBag size={21} />
            <span className="cx-cart-label">Giỏ hàng</span>
            {count > 0 && <b>{count}</b>}
          </button>
          <button
            ref={menuButton}
            className="cx-menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Đóng menu" : "Mở menu"}
            aria-expanded={menu}
            aria-controls="cx-navigation"
          >
            {menu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>
      {menu && (
        <button
          className="cx-menu-backdrop"
          tabIndex={-1}
          onClick={() => setMenu(false)}
          aria-label="Đóng menu điều hướng"
        />
      )}
      <main id="store-content" tabIndex={-1}>
        {error && !data ? (
          <div className="container page">
            <ErrorBox>{error}</ErrorBox>
            <Button onClick={() => location.reload()}>Thử lại</Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="cx-footer">
        <div className="container">
          <div className="cx-footer-grid">
            <div>
              <Link
                to="/"
                className="cx-logo"
                aria-label="OD Store — trang chủ"
              >
                od<span>.</span>
              </Link>
              <h2>
                Phụ kiện cho công việc.
                <br />
                Và giờ giải trí.
              </h2>
              <p>
                Tai nghe, bàn phím, chuột và loa.
                <br />
                Tìm lựa chọn phù hợp với cách bạn sử dụng.
              </p>
            </div>
            <div>
              <h3>Khám phá</h3>
              <Link to="/products">Tất cả sản phẩm</Link>
              <Link to="/flash-sale">Flash sale</Link>
              <Link to="/lookup">Tra cứu đơn hàng</Link>
              <Link to="/cart">Giỏ hàng</Link>
            </div>
            <div>
              <h3>Liên hệ cửa hàng</h3>
              {data?.store?.phone && (
                <a href={"tel:" + data.store.phone}>
                  <Phone size={15} />
                  {data.store.phone}
                </a>
              )}
              {data?.store?.email && (
                <a href={"mailto:" + data.store.email}>
                  <Mail size={15} />
                  {data.store.email}
                </a>
              )}
              <p>{data?.store?.address}</p>
              <span className="cx-payment-note">
                {[
                  data?.payment?.cod && "COD",
                  data?.payment?.bank && "Chuyển khoản",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </div>
          <div className="cx-footer-bottom">
            <span>
              © {new Date().getFullYear()} {data?.store?.name || "OD. Store"}
            </span>
            <span>Giá và tồn kho được cập nhật từ cửa hàng.</span>
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                })
              }
            >
              Lên đầu trang ↑
            </button>
          </div>
        </div>
      </footer>
      <nav className="cx-mobile-dock" aria-label="Điều hướng nhanh">
        <NavLink to="/" end>
          <House size={20} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink to="/products">
          <Grid2X2 size={20} />
          <span>Sản phẩm</span>
        </NavLink>
        <NavLink to="/flash-sale">
          <Zap size={20} />
          <span>Flash sale</span>
          {active > 0 && <i />}
        </NavLink>
        <NavLink to="/lookup">
          <Package size={20} />
          <span>Đơn hàng</span>
        </NavLink>
        <button
          onClick={() => setCartOpen(true)}
          aria-label={`Mở giỏ hàng, ${count} sản phẩm`}
        >
          <ShoppingBag size={20} />
          <span>Giỏ hàng</span>
          {count > 0 && <b className="cx-dock-count">{count}</b>}
        </button>
      </nav>
      {cartOpen && (
        <Modal title="Giỏ hàng của bạn" onClose={() => setCartOpen(false)}>
          {renderCart()}
        </Modal>
      )}
    </div>
  );
}
