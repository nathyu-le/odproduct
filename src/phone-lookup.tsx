import {
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, asset, date, money, status, type Obj } from "./api";
import { tx } from "./i18n";
import { Badge, Button, Empty, ErrorBox, Field } from "./ui";
export function rememberOrder(code: string, token: string) {
  try {
    const saved = JSON.parse(localStorage.getItem("od.orders") || "{}");
    saved[code] = token;
    localStorage.setItem("od.orders", JSON.stringify(saved));
  } catch {}
}
export function savedOrderLink(code: string) {
  try {
    return JSON.parse(localStorage.getItem("od.orders") || "{}")[code] || "";
  } catch {
    return "";
  }
}
export function PhoneLookup() {
  const [phone, setPhone] = useState(""),
    [searched, setSearched] = useState(""),
    [filter, setFilter] = useState("all"),
    [data, setData] = useState<Obj | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function search(value: string, page = 1, kind = filter) {
    setBusy(true);
    setError("");
    try {
      setData(await api("lookup/phone", { phone: value, page, filter: kind }));
      setSearched(value);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page phone-history">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tx("ĐƠN HÀNG CỦA BẠN")}</p>
          <h1>
            {tx("Nhập số điện thoại.")}
            <br />
            <span>{tx("Xem lại mọi đơn hàng.")}</span>
          </h1>
          <p>{tx("Cả đơn đang giao và những món bạn đã mua từ trước.")}</p>
        </div>
      </div>
      <form
        className="panel lookup-phone-form"
        onSubmit={(e) => {
          e.preventDefault();
          search(phone);
        }}
      >
        <Field label={tx("Số điện thoại đã đặt hàng")}>
          <input
            required
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={tx("Nhập số điện thoại của bạn")}
            maxLength={25}
          />
        </Field>
        <Button loading={busy} variant="dark">
          <Search size={18} />
          {tx(" Tìm đơn hàng")}
        </Button>
      </form>
      <ErrorBox>{error}</ErrorBox>
      {data && (
        <>
          <div className="history-filters">
            {[
              ["all", tx("Tất cả")],
              ["active", tx("Đang xử lý")],
              ["completed", tx("Đã giao")],
              ["cancelled", tx("Đã huỷ")],
            ].map(([k, l]) => (
              <button
                disabled={busy}
                className={filter === k ? "active" : ""}
                key={k}
                onClick={() => {
                  setFilter(k);
                  search(searched, 1, k);
                }}
              >
                {l}
              </button>
            ))}
            <span>
              {data.total}
              {tx(" đơn hàng")}
            </span>
          </div>
          {!data.orders.length ? (
            <Empty title={tx("Chưa có đơn phù hợp")}>
              {tx("Kiểm tra lại số điện thoại hoặc chọn bộ lọc khác.")}
            </Empty>
          ) : (
            <div className="phone-order-list">
              {data.orders.map((o: Obj) => (
                <article className="panel phone-order" key={o.code}>
                  <header>
                    <div>
                      <strong>{o.code}</strong>
                      <small>{date(o.created_at)}</small>
                    </div>
                    <Badge tone={o.status === "cancelled" ? "red" : "lime"}>
                      {status[o.status]}
                    </Badge>
                  </header>
                  {o.items.map((i: Obj, n: number) => (
                    <div className="mini-item" key={n}>
                      <img src={asset(i.image)} alt="" />
                      <div>
                        <strong>{i.product_name}</strong>
                        <small>
                          {i.variant_name}
                          {tx(" · Số lượng ")}
                          {i.quantity}
                        </small>
                      </div>
                      <b>{money(i.unit_price * i.quantity)}</b>
                    </div>
                  ))}
                  <footer>
                    <span>
                      {tx("Thanh toán: ")}
                      {status[o.payment_status]}
                    </span>
                    <strong>
                      {o.total == null
                        ? tx("Đang xác nhận phí giao")
                        : money(o.total)}
                    </strong>
                  </footer>
                  {savedOrderLink(o.code) && (
                    <Link
                      className="text-link"
                      to={"/order/" + savedOrderLink(o.code)}
                    >
                      {tx("Mở chi tiết đơn đã lưu trên thiết bị")}{" "}
                      <ChevronRight size={15} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
          {data.pages > 1 && (
            <div className="history-pagination">
              <Button
                disabled={busy || data.page <= 1}
                variant="outline"
                onClick={() => search(searched, data.page - 1)}
              >
                <ChevronLeft size={16} />
                {tx(" Trước")}
              </Button>
              <span>
                {data.page} / {data.pages}
              </span>
              <Button
                disabled={busy || data.page >= data.pages}
                variant="outline"
                onClick={() => search(searched, data.page + 1)}
              >
                Sau <ChevronRight size={16} />
              </Button>
            </div>
          )}
          <p className="lookup-privacy">
            <ShieldCheck size={16} />
            {tx(
              " Địa chỉ và thông tin người nhận được giữ riêng tư. Mở liên kết riêng của đơn để xem phiếu bán hàng và thao tác thanh toán.",
            )}
          </p>
        </>
      )}
      {!data && (
        <div className="lookup-empty">
          <Package size={36} />
          <p>{tx("Không cần nhớ mã đơn hay chụp lại màn hình.")}</p>
        </div>
      )}
    </div>
  );
}
