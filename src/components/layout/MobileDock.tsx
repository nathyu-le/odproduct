import { Grid2X2, House, Package, ShoppingBag, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useStore } from "../../context";
import { tx } from "../../i18n";
import { saleState, useNow } from "../../promotions";
export function MobileDock() {
  const { data, count, setCartOpen } = useStore();
  const now = useNow();
  const active = (data?.products || []).filter(
    (p: any) => saleState(p, now) === "active",
  ).length;
  return (
    <nav className="cx-mobile-dock" aria-label={tx("Điều hướng nhanh")}>
      <NavLink to="/" end>
        <House size={20} />
        <span>{tx("Trang chủ")}</span>
      </NavLink>
      <NavLink to="/products">
        <Grid2X2 size={20} />
        <span>{tx("Sản phẩm")}</span>
      </NavLink>
      <NavLink to="/flash-sale">
        <Zap size={20} />
        <span>{tx("Flash sale")}</span>
        {active > 0 && <i />}
      </NavLink>
      <NavLink to="/lookup">
        <Package size={20} />
        <span>{tx("Đơn hàng")}</span>
      </NavLink>
      <button
        onClick={() => setCartOpen(true)}
        aria-label={tx("Mở giỏ hàng, {0} sản phẩm", [count])}
      >
        <ShoppingBag size={20} />
        <span>{tx("Giỏ hàng")}</span>
        {count > 0 && <b className="cx-dock-count">{count}</b>}
      </button>
    </nav>
  );
}
