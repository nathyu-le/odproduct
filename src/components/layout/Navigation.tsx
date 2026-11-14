import { Zap } from "lucide-react";
import type { RefObject } from "react";
import { NavLink } from "react-router-dom";
import { tx } from "../../i18n";
export function Navigation({
  menu,
  navRef,
  onClose,
  active,
}: {
  menu: boolean;
  navRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  active: number;
}) {
  return (
    <nav
      ref={navRef}
      id="cx-navigation"
      className={"cx-navigation" + (menu ? " is-open" : "")}
      aria-label={tx("Điều hướng cửa hàng")}
    >
      {[
        ["/", tx("Trang chủ")],
        ["/products", tx("Sản phẩm")],
        ["/flash-sale", tx("Flash sale")],
        ["/blog", tx("Journal")],
        ["/lookup", tx("Tra cứu đơn")],
      ].map(([path, label]) => (
        <NavLink key={path} to={path} end={path === "/"} onClick={onClose}>
          {path === "/flash-sale" && <Zap size={15} />} {label}
          {path === "/flash-sale" && active > 0 && (
            <span className="cx-nav-count">{active}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
