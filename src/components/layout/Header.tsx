import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  Search,
  ShoppingBag,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Obj } from "../../api";
import { useStore } from "../../context";
import { tx } from "../../i18n";
import { saleState, useNow } from "../../promotions";
import { LanguageSelector } from "./LanguageSelector";
import { Navigation } from "./Navigation";
import { BrandLogo } from "../BrandLogo";
import { brandText, defaultBranding } from "../../branding";
import { runtime } from "../../runtime";
export function Header() {
  const { data, count, setCartOpen } = useStore();
  const branding = data?.branding || runtime.branding || defaultBranding;
  const [menu, setMenu] = useState(false);
  const button = useRef<HTMLButtonElement>(null),
    nav = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const now = useNow();
  const active = (data?.products || []).filter(
    (p: Obj) => saleState(p, now) === "active",
  ).length;
  useEffect(() => {
    if (!menu) return;
    if (matchMedia("(max-width: 1300px)").matches)
      nav.current?.querySelector("a")?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);
  return (
    <>
      {branding.announcement_enabled !== false && (
        <div className="cx-announcement">
          <div className="container">
            <span>
              {tx(brandText(branding, "announcement")) ||
                (data?.store?.banner ? tx(data.store.banner) : "") ||
                tx("Phụ kiện công nghệ, chọn vừa nhu cầu.")}
            </span>
            <Link to="/flash-sale">
              <Zap size={13} />
              {active ? tx("Flash sale đang mở") : tx("Lịch flash sale")}
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      )}
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
          <Link
            to="/"
            className="cx-logo"
            aria-label={
              (data?.store?.name || runtime.storeName || "OD. Store") +
              " — " +
              tx("Trang chủ")
            }
          >
            <BrandLogo />
          </Link>
          <Navigation
            menu={menu}
            navRef={nav}
            onClose={() => setMenu(false)}
            active={active}
          />
          <div className="header-search-language">
            <form
              className="cx-search"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem(
                  "q",
                ) as HTMLInputElement;
                navigate(
                  "/products?q=" + encodeURIComponent(input.value.trim()),
                );
                setMenu(false);
              }}
            >
              <Search size={18} />
              <input
                name="q"
                type="search"
                aria-label={tx("Tìm sản phẩm")}
                placeholder={tx("Tìm tai nghe, bàn phím…")}
                autoComplete="off"
              />
              <button type="submit" aria-label={tx("Tìm kiếm")}>
                <ArrowRight size={18} />
              </button>
            </form>
            <LanguageSelector />
          </div>
          <button
            className="cx-cart"
            onClick={() => setCartOpen(true)}
            aria-label={tx("Mở giỏ hàng, {0} sản phẩm", [count])}
          >
            <ShoppingBag size={21} />
            <span className="cx-cart-label">{tx("Giỏ hàng")}</span>
            {count > 0 && <b>{count}</b>}
          </button>
          <button
            ref={button}
            className="cx-menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? tx("Đóng menu") : tx("Mở menu")}
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
          aria-label={tx("Đóng menu điều hướng")}
        />
      )}
    </>
  );
}
