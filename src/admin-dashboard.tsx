import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Package,
  RefreshCw,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { api, asset, money, date, status, type Obj } from "./api";
import { Button, Badge, ErrorBox, Loading } from "./ui";
const day = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
const labels: Obj = {
  received: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Chuẩn bị hàng",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};
const colors: Obj = {
  received: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  shipping: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#f43f5e",
};
const compact = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
function rangeFor(kind: string) {
  const to = day(),
    d = new Date(to + "T00:00:00Z");
  if (kind === "month") return { from: to.slice(0, 7) + "-01", to };
  d.setUTCDate(d.getUTCDate() - (kind === "week" ? 6 : 29));
  return { from: d.toISOString().slice(0, 10), to };
}
export function AdminDashboard() {
  const [kind, setKind] = useState("month"),
    [data, setData] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const range = rangeFor(kind);
  useEffect(() => {
    let active = true;
    const load = () =>
      api(`admin/dashboard?from=${range.from}&to=${range.to}`)
        .then((d) => {
          if (active) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [kind, revision]);
  const report = data?.report;
  const totals = report?.totals || {};
  const rows = report?.rows || [];
  const pending = rows.filter((o: Obj) => o.status === "received"),
    review = rows.filter((o: Obj) => o.payment_status === "review");
  const points = useMemo(() => {
    const out: Obj[] = [];
    const d = new Date(range.from + "T00:00:00Z"),
      end = new Date(range.to + "T00:00:00Z");
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      const orders = rows.filter((o: Obj) => o.created_at.startsWith(key));
      out.push({
        day: key,
        label: key.slice(8) + "/" + key.slice(5, 7),
        revenue: orders.reduce((s: number, o: Obj) => s + Number(o.revenue), 0),
        profit: orders.reduce((s: number, o: Obj) => s + Number(o.profit), 0),
        orders: orders.length,
      });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }, [report, kind]);
  return (
    <div className="dashboard-v2">
      <div className="dash-heading">
        <div>
          <span className="admin-overline">OD. / TỔNG QUAN CỬA HÀNG</span>
          <h1>
            Cửa hàng hôm nay<span>.</span>
          </h1>
          <p>Theo dõi đơn, dòng tiền và những việc cần xử lý.</p>
        </div>
        <Link to="/" className="button outline">
          Mở cửa hàng <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="dash-datebar">
        <div className="range-switch">
          {[
            ["week", "7 ngày"],
            ["month", "Tháng này"],
            ["30days", "30 ngày"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={kind === k ? "active" : ""}
              onClick={() => setKind(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <span>
          {range.from.split("-").reverse().join("/")} —{" "}
          {range.to.split("-").reverse().join("/")}
        </span>
        <button
          className="icon-button"
          aria-label="Làm mới số liệu"
          onClick={() => setRevision((r) => r + 1)}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="dash-stats">
            <Metric
              label="Doanh thu thuần"
              value={money(totals.revenue)}
              note="Ghi nhận từ đơn đã giao"
              icon={Wallet}
              primary
            />
            <Metric
              label="Đơn hàng"
              value={rows.length}
              note={`${pending.length} đơn chờ xác nhận`}
              icon={ShoppingBag}
            />
            <Metric
              label="Lãi sau chi phí"
              value={money(totals.profit)}
              note="Đã tính giá vốn và chi phí"
              icon={TrendingUp}
            />
            <Metric
              label="Thực thu ròng"
              value={money(totals.cash)}
              note={`Công nợ ${money(totals.receivable)}`}
              icon={Wallet}
            />
          </div>
          <div className="dash-charts">
            <section className="panel revenue-panel">
              <div className="dash-panel-heading">
                <div>
                  <span className="admin-overline">HIỆU QUẢ BÁN HÀNG</span>
                  <h2>Doanh thu & lợi nhuận</h2>
                </div>
                <Badge>VND</Badge>
              </div>
              <RevenueChart points={points} />
              <p className="chart-note">
                Doanh thu theo ngày đặt của đơn đã giao, múi giờ Việt Nam.
              </p>
            </section>
            <section className="panel donut-panel">
              <div className="dash-panel-heading">
                <div>
                  <span className="admin-overline">HÀNH TRÌNH ĐƠN HÀNG</span>
                  <h2>Trạng thái đơn</h2>
                </div>
                <ShoppingBag size={17} strokeWidth={1.3} />
              </div>
              <OrderDonut values={data.statuses} />
            </section>
          </div>
          <div className="dash-workrow">
            <section className="panel action-panel">
              <div className="dash-panel-heading">
                <div>
                  <span className="admin-overline">ƯU TIÊN XỬ LÝ</span>
                  <h2>Việc cần chú ý</h2>
                </div>
                <Clock size={17} strokeWidth={1.3} />
              </div>
              <Link
                className="attention-row"
                to="/admin/orders?status=received"
              >
                <span className="attention-icon">
                  <ShoppingBag size={17} />
                </span>
                <div>
                  <strong>Đơn chờ xác nhận</strong>
                  <small>Đơn mới trong khoảng ngày đang xem</small>
                </div>
                <b>{pending.length}</b>
                <ChevronRight size={15} />
              </Link>
              <Link
                className="attention-row"
                to="/admin/orders?payment_status=review"
              >
                <span className="attention-icon amber">
                  <Wallet size={17} />
                </span>
                <div>
                  <strong>Chuyển khoản chờ kiểm tra</strong>
                  <small>Cần đối chiếu thực nhận trước khi xác nhận</small>
                </div>
                <b>{review.length}</b>
                <ChevronRight size={15} />
              </Link>
              <Link className="attention-row" to="/admin/flash-sales">
                <span className="attention-icon">
                  <TrendingUp size={17} />
                </span>
                <div>
                  <strong>Lên lịch Flash sale</strong>
                  <small>Giá ưu đãi, giờ bắt đầu và kết thúc</small>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            </section>
            <section className="panel inventory-panel">
              <div className="dash-panel-heading">
                <div>
                  <span className="admin-overline">TỒN KHO</span>
                  <h2>
                    Sản phẩm cần bổ sung <Badge>{data.low_stock_count}</Badge>
                  </h2>
                </div>
                <Link to="/admin/products" className="text-link">
                  Xem kho <ArrowUpRight size={13} />
                </Link>
              </div>
              {data.low_stock.length ? (
                data.low_stock.map((p: Obj) => (
                  <Link
                    className="low-stock-row"
                    to="/admin/products"
                    key={p.id}
                  >
                    <img src={asset(p.image)} alt="" />
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.sku}</small>
                    </div>
                    <Badge tone={Number(p.stock) === 0 ? "red" : ""}>
                      {Number(p.stock) === 0 ? "Hết hàng" : "Còn " + p.stock}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="dash-empty">
                  <CheckCircle2 size={28} strokeWidth={1.3} />
                  <p>Kho hiện chưa có sản phẩm dưới mức 6.</p>
                </div>
              )}
            </section>
          </div>
          <section className="panel recent-panel">
            <div className="dash-panel-heading">
              <div>
                <span className="admin-overline">CẬP NHẬT GẦN NHẤT</span>
                <h2>Đơn trong kỳ</h2>
              </div>
              <Link to="/admin/orders" className="text-link">
                Tất cả đơn <ArrowRight size={15} />
              </Link>
            </div>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Doanh thu thuần</th>
                  <th>Xử lý</th>
                  <th>Thanh toán</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((o: Obj) => (
                  <tr key={o.id}>
                    <td data-label="Mã đơn">
                      <Link to={"/admin/orders/" + o.id}>
                        <strong>{o.code}</strong>
                      </Link>
                    </td>
                    <td data-label="Khách hàng">{o.customer_name}</td>
                    <td data-label="Ngày đặt">{date(o.created_at)}</td>
                    <td data-label="Doanh thu">{money(o.revenue)}</td>
                    <td data-label="Xử lý">
                      <Badge
                        tone={
                          o.status === "delivered"
                            ? "lime"
                            : o.status === "cancelled"
                              ? "red"
                              : ""
                        }
                      >
                        {status[o.status]}
                      </Badge>
                    </td>
                    <td data-label="Thanh toán">
                      <Badge>{status[o.payment_status]}</Badge>
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        to={"/admin/orders/" + o.id}
                        aria-label={"Xem " + o.code}
                      >
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="dash-empty">
                <Package size={25} strokeWidth={1.2} />
                <p>Chưa có đơn trong khoảng ngày này.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
function Metric({ label, value, note, icon: Icon, primary }: any) {
  return (
    <div className={"metric " + (primary ? "primary" : "")}>
      <div>
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={16} strokeWidth={1.5} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
export function RevenueChart({ points }: { points: Obj[] }) {
  const [series, setSeries] = useState("both"),
    [selected, setSelected] = useState<number | null>(null);
  const width = 720,
    height = 225,
    left = 58,
    right = 12,
    top = 22,
    bottom = 35;
  const values = points.flatMap((p) =>
    series === "revenue"
      ? [p.revenue]
      : series === "profit"
        ? [p.profit]
        : [p.revenue, p.profit],
  );
  const min = Math.min(0, ...values),
    max = Math.max(1, ...values),
    span = max - min || 1;
  const x = (i: number) =>
      left +
      (width - left - right) *
        (points.length <= 1 ? 0.5 : i / (points.length - 1)),
    y = (n: number) => top + ((max - n) / span) * (height - top - bottom);
  const path = (k: string) =>
    points.map((p, i) => `${x(i)},${y(p[k])}`).join(" ");
  const highlighted = selected == null ? null : points[selected];
  const nonzero = values.some((v) => v !== 0);
  return (
    <div className="revenue-chart">
      <div className="chart-switch">
        {[
          ["both", "Cả hai"],
          ["revenue", "Doanh thu"],
          ["profit", "Lợi nhuận"],
        ].map(([k, l]) => (
          <button
            className={series === k ? "active" : ""}
            key={k}
            onClick={() => setSeries(k)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="line-chart-frame">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Biểu đồ doanh thu và lợi nhuận theo ngày"
        >
          {Array.from({ length: 4 }, (_, i) => {
            const n = min + ((max - min) * i) / 3;
            return (
              <g key={i} aria-hidden="true">
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(n)}
                  y2={y(n)}
                  stroke="#edf0f5"
                  strokeDasharray="3 5"
                />
                <text
                  x={left - 11}
                  y={y(n) + 4}
                  textAnchor="end"
                  fill="#9ba78e"
                  fontSize="12"
                >
                  {nonzero ? compact(n) : i === 0 ? "0" : "—"}
                </text>
              </g>
            );
          })}
          {series !== "profit" && points.length > 0 && (
            <>
              <polygon
                points={`${x(0)},${y(0)} ${path("revenue")} ${x(points.length - 1)},${y(0)}`}
                fill="#edf3ff"
              />
              <polyline
                points={path("revenue")}
                fill="none"
                stroke="#3878e9"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}
          {series !== "revenue" && points.length > 0 && (
            <polyline
              points={path("profit")}
              fill="none"
              stroke="#f58a43"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {points.map((p, i) => (
            <g key={p.day}>
              {(i === 0 ||
                i === points.length - 1 ||
                i % Math.max(1, Math.floor(points.length / 5)) === 0) && (
                <text
                  x={x(i)}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#9ba78e"
                  fontSize="11"
                  aria-hidden="true"
                >
                  {p.label}
                </text>
              )}
              <rect
                x={
                  x(i) -
                  Math.max(
                    5,
                    (width - left - right) / Math.max(1, points.length) / 2,
                  )
                }
                y={top}
                width={Math.max(
                  10,
                  (width - left - right) / Math.max(1, points.length),
                )}
                height={height - top - bottom}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${p.label}: doanh thu ${money(p.revenue)}, lợi nhuận ${money(p.profit)}`}
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                onMouseLeave={() => setSelected(null)}
                onBlur={() => setSelected(null)}
              />
            </g>
          ))}
          {highlighted && selected != null && (
            <g aria-hidden="true">
              <line
                x1={x(selected)}
                x2={x(selected)}
                y1={top}
                y2={height - bottom}
                stroke="#afbea0"
                strokeDasharray="4 4"
              />
              {series !== "profit" && (
                <circle
                  cx={x(selected)}
                  cy={y(highlighted.revenue)}
                  r="4"
                  fill="#3878e9"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
              {series !== "revenue" && (
                <circle
                  cx={x(selected)}
                  cy={y(highlighted.profit)}
                  r="4"
                  fill="#f58a43"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>
        {!nonzero && (
          <span className="chart-zero">
            Chưa có doanh thu được ghi nhận trong kỳ
          </span>
        )}
        {highlighted && (
          <div className="chart-tooltip">
            <strong>{highlighted.label}</strong>
            <span>
              Doanh thu <b>{money(highlighted.revenue)}</b>
            </span>
            <span>
              Lợi nhuận <b>{money(highlighted.profit)}</b>
            </span>
          </div>
        )}
      </div>
      <div className="chart-legend">
        <span>
          <i style={{ background: "#3878e9" }} />
          Doanh thu thuần
        </span>
        <span>
          <i style={{ background: "#f58a43" }} />
          Lãi sau chi phí
        </span>
      </div>
    </div>
  );
}
function OrderDonut({ values }: { values: Obj }) {
  const total = Object.values(values).reduce(
    (s: number, n: any) => s + Number(n),
    0,
  );
  const [hover, setHover] = useState<string | null>(null);
  let start = 0;
  const circumference = 2 * Math.PI * 70;
  return (
    <div className="order-donut">
      <div className="donut-graphic">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label={`Tổng ${total} đơn theo trạng thái`}
        >
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="#edf0f6"
            strokeWidth="19"
          />
          {Object.entries(labels).map(([key]) => {
            const amount = Number(values[key] || 0);
            if (!amount || !total) return null;
            const length = (amount / total) * circumference;
            const dash = Math.max(0, length - 3);
            const o = start;
            start += length;
            return (
              <circle
                key={key}
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={colors[key]}
                strokeWidth={hover === key ? 23 : 19}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-o}
                transform="rotate(-90 90 90)"
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="donut-center">
          <strong>{hover ? values[hover] || 0 : total}</strong>
          <span>{hover ? labels[hover] : "tổng đơn hàng"}</span>
        </div>
      </div>
      <div className="donut-legend">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            onMouseEnter={() => setHover(key)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(key)}
            onBlur={() => setHover(null)}
          >
            <i style={{ background: colors[key] }} />
            <span>{label as string}</span>
            <b>{values[key] || 0}</b>
            <small>
              {total ? Math.round((Number(values[key] || 0) / total) * 100) : 0}
              %
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}
