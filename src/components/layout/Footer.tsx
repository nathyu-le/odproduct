import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../../context";
import { tx } from "../../i18n";
export function Footer() {
  const { data } = useStore();
  return (
    <footer className="cx-footer">
      <div className="container">
        <div className="cx-footer-grid">
          <div>
            <Link
              to="/"
              className="cx-logo"
              aria-label={tx("OD Store — trang chủ")}
            >
              od<span>.</span>
            </Link>
            <h2>
              {tx("Phụ kiện cho công việc.")}
              <br />
              {tx("Và giờ giải trí.")}
            </h2>
            <p>
              {tx("Tai nghe, bàn phím, chuột và loa.")}
              <br />
              {tx("Tìm lựa chọn phù hợp với cách bạn sử dụng.")}
            </p>
          </div>
          <div>
            <h3>{tx("Khám phá")}</h3>
            <Link to="/products">{tx("Tất cả sản phẩm")}</Link>
            <Link to="/flash-sale">{tx("Flash sale")}</Link>
            <Link to="/blog">{tx("Journal")}</Link>
            <Link to="/lookup">{tx("Tra cứu đơn hàng")}</Link>
            <Link to="/cart">{tx("Giỏ hàng")}</Link>
          </div>
          <div>
            <h3>{tx("Liên hệ cửa hàng")}</h3>
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
                data?.payment?.cod && tx("COD"),
                data?.payment?.bank && tx("Chuyển khoản"),
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
          <span>{tx("Giá và tồn kho được cập nhật từ cửa hàng.")}</span>
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            {tx("Lên đầu trang ↑")}
          </button>
        </div>
      </div>
    </footer>
  );
}
