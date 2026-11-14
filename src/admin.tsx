import { appBase } from "./runtime";
import {
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AddressSearch } from "./address-search";
import { AdminDashboard } from "./admin-dashboard";
import { AdminFlashSales } from "./admin-flash-sales";
import { api, asset, date, money, status, upload, type Obj } from "./api";
import { LanguageSelector } from "./components/layout/LanguageSelector";
import { useStore } from "./context";
import { csv } from "./csv";
import { BlogManager } from "./features/blog/BlogManager";
import { ContentSettings } from "./features/settings/ContentSettings";
import { ContentTranslations } from "./features/settings/ContentTranslations";
import { SeoSettings } from "./features/settings/SeoSettings";
import { tx, useI18n } from "./i18n";
import { MapsSettings } from "./maps-settings";
import { OrderWorkflow } from "./order-workflow";
import { Receipt } from "./store";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Modal,
  Success,
} from "./ui";
function useLoad(route: string) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  const load = () =>
    api(route)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    setData(null);
    load();
  }, [route]);
  return { data, setData, error, load };
}
export function Admin() {
  useI18n();
  const { session, setSession } = useStore();
  const [menu, setMenu] = useState(false);
  if (!session) return <Loading />;
  if (!session.user) return <Login />;
  const u = session.user;
  const links = [
    ["", tx("Tổng quan"), LayoutDashboard],
    ["orders", tx("Đơn hàng"), ShoppingBag],
    ...(u.role === "admin"
      ? [
          ["products", tx("Sản phẩm"), Package],
          ["flash-sales", tx("Flash sale"), Zap],
          ["categories", tx("Danh mục"), Tag],
          ["blog", tx("Bài viết / SEO"), FileText],
          ["coupons", tx("Mã giảm giá"), Tag],
          ["reports", tx("Báo cáo"), ChartNoAxesCombined],
          ["settings", tx("Thiết lập"), Settings],
          ["users", tx("Nhân viên"), Users],
          ["audit", tx("Lịch sử thao tác"), History],
        ]
      : []),
  ];
  return (
    <div className={"admin-layout " + (menu ? "menu-open" : "")}>
      <aside className="admin-sidebar">
        <button
          className="icon-button admin-sidebar-close"
          aria-label={tx("Đóng menu quản trị")}
          onClick={() => setMenu(false)}
        >
          <X size={16} />
        </button>
        <div className="admin-brand">
          <a className="logo" href={appBase}>
            od<span>.</span>
          </a>
          <span>
            {tx("WORKSPACE")}
            <br />
            {tx("QUẢN TRỊ")}
          </span>
        </div>
        <div className="sidebar-label">{tx("CỬA HÀNG CỦA BẠN")}</div>
        <nav>
          {links.map(([path, label, Icon]: any) => (
            <NavLink
              key={path}
              to={"/admin/" + path}
              end={!path}
              onClick={() => setMenu(false)}
            >
              <Icon size={17} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-label" style={{ marginTop: 20 }}>
          {tx("KÊNH BÁN HÀNG")}
        </div>
        <nav>
          <a href={appBase}>
            <ExternalLink size={16} />
            {tx(" Xem cửa hàng")}
          </a>
        </nav>
        <div className="admin-sidebar-bottom">
          <p>{u.name}</p>
          <small>
            {u.role === "admin" ? tx("Quản trị viên") : tx("Nhân viên")}
          </small>
          <button
            onClick={async () => {
              await api("logout", {});
              setSession(await api("session"));
            }}
          >
            <LogOut size={15} />
            {tx(" Đăng xuất")}
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <button
              className="icon-button admin-mobile-toggle"
              aria-label={tx("Menu quản trị")}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="lime-dot" />
            <span>{tx("OD. Store / Quản trị cửa hàng")}</span>
          </div>
          <div>
            <LanguageSelector />
            <span>Asia/Ho_Chi_Minh</span>
            <span className="avatar">{u.name.slice(0, 1)}</span>
          </div>
        </div>
        <div className="admin-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<AdminOrder />} />
            {u.role === "admin" && (
              <>
                <Route path="products" element={<Products />} />
                <Route path="flash-sales" element={<AdminFlashSales />} />
                <Route path="categories" element={<Categories />} />
                <Route path="blog/*" element={<BlogManager />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<StoreSettings />} />
                <Route path="users" element={<Staff />} />
                <Route path="audit" element={<Audit />} />
              </>
            )}
            <Route
              path="*"
              element={
                <Empty title={tx("Trang không khả dụng")}>
                  {tx("Tài khoản cần quyền quản trị viên cho chức năng này.")}
                </Empty>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
function Login() {
  const { setSession } = useStore();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="admin-login">
      <div>
        <a className="logo" href={appBase}>
          od<span>.</span>
        </a>
        <LanguageSelector />
        <div className="panel">
          <p className="eyebrow">{tx("STORE WORKSPACE")}</p>
          <h1>{tx("Chào mừng trở lại.")}</h1>
          <p>{tx("Đăng nhập để chăm sóc cửa hàng của bạn.")}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                setSession(await api("login", { email, password }));
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={tx("Mật khẩu")}>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <ErrorBox>{error}</ErrorBox>
            <Button variant="dark full" loading={busy}>
              {tx("Đăng nhập ")}
              <ArrowUpRight size={16} />
            </Button>
          </form>
          <p className="small" style={{ marginTop: 20 }}>
            {tx(
              "Tài khoản đầu tiên được tạo trên trang cài đặt khi upload hosting. Không có mật khẩu mặc định.",
            )}
          </p>
        </div>
        <a className="text-link" href={appBase}>
          <ArrowLeft size={14} />
          {tx(" Về cửa hàng")}
        </a>
      </div>
    </div>
  );
}
function Heading({ title, description, children }: any) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Stat({ label, value, note, icon: Icon, primary }: any) {
  return (
    <div className={"stat-card " + (primary ? "primary" : "")}>
      <p>
        {label}
        {Icon && <Icon size={15} strokeWidth={1.5} />}
      </p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
function Dashboard() {
  const { session } = useStore();
  return session.user.role === "admin" ? (
    <AdminDashboard />
  ) : (
    <StaffDashboard />
  );
}
function StaffDashboard() {
  const { session } = useStore();
  const isAdmin = session.user.role === "admin";
  const { data: orders, error } = useLoad("admin/orders");
  const { data: r } = useLoad(
    isAdmin
      ? "admin/report?from=" + today().slice(0, 7) + "-01&to=" + today()
      : "admin/orders",
  );
  return (
    <>
      <Heading
        title={tx("Một ngày tốt lành 👋")}
        description={tx("Mọi hoạt động của cửa hàng, gọn trong một nơi.")}
      >
        <a className="button outline" href={appBase}>
          {tx("Xem cửa hàng ")}
          <ArrowUpRight size={15} />
        </a>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      {isAdmin && (
        <div className="stats-grid">
          <Stat
            label={tx("Doanh thu thuần tháng này")}
            value={money(r?.totals?.revenue || 0)}
            note={tx("Chỉ đơn giao thành công")}
            icon={Wallet}
            primary
          />
          <Stat
            label={tx("Đơn hàng")}
            value={r?.rows?.length || 0}
            note={tx("Theo ngày đặt trong tháng")}
            icon={ShoppingBag}
          />
          <Stat
            label={tx("Lãi sau chi phí")}
            value={money(r?.totals?.profit || 0)}
            note={tx("Đã tính giá vốn và chi phí")}
            icon={TrendingUp}
          />
          <Stat
            label={tx("Công nợ còn lại")}
            value={money(r?.totals?.receivable || 0)}
            note={tx("Tách riêng tiền đã thực thu")}
            icon={ChartNoAxesCombined}
          />
        </div>
      )}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>{tx("Doanh thu trong tháng")}</h2>
            <Badge>VND</Badge>
          </div>
          {isAdmin && r?.rows?.some((x: Obj) => x.revenue > 0) ? (
            <div className="bar-chart">
              {Array.from({ length: 7 }, (_, i) => {
                const day = new Date();
                day.setDate(day.getDate() - (6 - i));
                const ds = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Ho_Chi_Minh",
                }).format(day);
                const amount = r.rows
                  .filter((x: Obj) => x.created_at.startsWith(ds))
                  .reduce((s: number, x: Obj) => s + x.revenue, 0);
                const max = Math.max(1, ...r.rows.map((x: Obj) => x.revenue));
                return (
                  <div className="bar-column" key={i} title={money(amount)}>
                    <span
                      style={{
                        height: Math.min(100, (amount / max) * 100) + "%",
                      }}
                    />
                    <small>{ds.slice(5)}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="chart-empty">
              {isAdmin
                ? tx(
                    "Chưa có doanh thu được ghi nhận. Dữ liệu sẽ xuất hiện khi giao đơn thành công.",
                  )
                : tx("Báo cáo tài chính dành cho quản trị viên.")}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>{tx("Việc cần chú ý")}</h2>
            <ShieldCheck size={17} strokeWidth={1.4} />
          </div>
          <div className="admin-detail-line">
            <span>{tx("Đơn chờ xác nhận (20 đơn gần nhất)")}</span>
            <strong>
              {orders?.orders.filter((o: Obj) => o.status === "received")
                .length || 0}
            </strong>
          </div>
          <div className="admin-detail-line">
            <span>{tx("Chuyển khoản chờ kiểm tra")}</span>
            <strong>
              {orders?.orders.filter((o: Obj) => o.payment_status === "review")
                .length || 0}
            </strong>
          </div>
          <div className="notice">
            <Truck size={17} />
            <p>
              {tx(
                "Đơn chờ phí giao cần khách chấp nhận tổng tiền trước khi xử lý.",
              )}
            </p>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>{tx("Đơn hàng gần đây")}</h2>
          <Link className="text-link" to="/admin/orders">
            {tx("Tất cả đơn ")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        {orders ? <OrderTable rows={orders.orders.slice(0, 6)} /> : <Loading />}
      </section>
    </>
  );
}
function OrderTable({ rows }: { rows: Obj[] }) {
  return rows.length ? (
    <table className="responsive-table">
      <thead>
        <tr>
          {[
            tx("Mã đơn"),
            tx("Khách hàng"),
            tx("Thời gian"),
            tx("Tổng tiền"),
            tx("Xử lý"),
            tx("Thanh toán"),
            "",
          ].map((s, i) => (
            <th key={i}>{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td data-label={tx("Mã đơn")}>
              <Link to={"/admin/orders/" + o.id}>
                <strong>{o.code}</strong>
              </Link>
            </td>
            <td data-label={tx("Khách hàng")}>{o.customer_name}</td>
            <td data-label={tx("Thời gian")}>{date(o.created_at)}</td>
            <td data-label={tx("Tổng tiền")}>
              <strong>{money(o.total)}</strong>
            </td>
            <td data-label={tx("Xử lý")}>
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
            <td data-label={tx("Thanh toán")}>
              <Badge tone={o.payment_status === "paid" ? "lime" : ""}>
                {status[o.payment_status]}
              </Badge>
            </td>
            <td>
              <Link
                className="icon-button"
                aria-label={tx("Xem đơn ") + o.code}
                to={"/admin/orders/" + o.id}
              >
                <ArrowUpRight size={15} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <Empty title={tx("Chưa có đơn hàng")}>
      {tx("Đơn mới sẽ xuất hiện tại đây.")}
    </Empty>
  );
}
function Orders() {
  const [queryParams] = useSearchParams();
  const [filters, setFilters] = useState<Obj>({
    q: "",
    status: queryParams.get("status") || "",
    payment_status: queryParams.get("payment_status") || "",
    from: "",
    to: "",
    page: 1,
  });
  const { data, error, load } = useLoad(
    "admin/orders?" + new URLSearchParams(filters as any),
  );
  const change = (k: string, v: any) =>
    setFilters((f) => ({ ...f, [k]: v, ...(k === "page" ? {} : { page: 1 }) }));
  const [exporting, setExporting] = useState(false),
    [expError, setExpError] = useState("");
  return (
    <>
      <Heading
        title={tx("Đơn hàng")}
        description={tx("Theo dõi, xác nhận và xử lý từng đơn hàng.")}
      >
        <Button
          variant="outline"
          loading={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              let rows: Obj[] = [];
              let page = 1;
              let total = 1;
              while (rows.length < total) {
                const d = await api(
                  "admin/orders?" +
                    new URLSearchParams({ ...filters, page: String(page) }),
                );
                rows.push(...d.orders);
                total = d.total;
                if (!d.orders.length) break;
                page++;
              }
              csv("Danh-sach-don-hang.csv", [
                [
                  tx("Mã đơn"),
                  tx("Khách hàng"),
                  tx("SĐT"),
                  tx("Ngày"),
                  tx("Tổng"),
                  tx("Xử lý"),
                  tx("Thanh toán"),
                ],
                ...rows.map((o) => [
                  o.code,
                  o.customer_name,
                  o.phone,
                  o.created_at,
                  o.total,
                  status[o.status],
                  status[o.payment_status],
                ]),
              ]);
            } catch (e: any) {
              setExpError(e.message);
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download size={15} />
          {tx(" Xuất CSV")}
        </Button>
      </Heading>
      <ErrorBox>{error || expError}</ErrorBox>
      <section className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              value={filters.q}
              placeholder={tx("Mã đơn, tên, điện thoại…")}
              aria-label={tx("Tìm đơn hàng")}
              onChange={(e) => change("q", e.target.value)}
            />
          </div>
          <select
            aria-label={tx("Lọc xử lý")}
            value={filters.status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="">{tx("Tất cả xử lý")}</option>
            {[
              "received",
              "confirmed",
              "preparing",
              "shipping",
              "delivered",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {status[s]}
              </option>
            ))}
          </select>
          <select
            aria-label={tx("Lọc thanh toán")}
            value={filters.payment_status}
            onChange={(e) => change("payment_status", e.target.value)}
          >
            <option value="">{tx("Tất cả thanh toán")}</option>
            {["pending", "review", "paid", "refunded", "partial_refund"].map(
              (s) => (
                <option key={s} value={s}>
                  {status[s]}
                </option>
              ),
            )}
          </select>
          <input
            type="date"
            value={filters.from}
            aria-label={tx("Từ ngày")}
            onChange={(e) => change("from", e.target.value)}
          />
          <input
            type="date"
            value={filters.to}
            aria-label={tx("Đến ngày")}
            onChange={(e) => change("to", e.target.value)}
          />
          <Button variant="outline" onClick={load}>
            <RefreshCw size={15} />
          </Button>
        </div>
        {data ? (
          <>
            <OrderTable rows={data.orders} />
            <div className="pagination">
              <span>
                {data.total}
                {tx(" đơn · Trang ")}
                {data.page}/{Math.max(1, Math.ceil(data.total / 20))}
              </span>
              <div>
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => change("page", filters.page - 1)}
                >
                  <ChevronLeft size={14} />
                  {tx(" Trước")}
                </Button>
                <Button
                  variant="outline"
                  disabled={filters.page * 20 >= data.total}
                  onClick={() => change("page", filters.page + 1)}
                >
                  Sau <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Loading />
        )}
      </section>
    </>
  );
}
function AdminOrder() {
  const { id } = useParams();
  const {
    data: o,
    setData: setO,
    error: loadError,
    load,
  } = useLoad("admin/orders/" + id);
  const { session, setToast } = useStore();
  const isAdmin = session.user.role === "admin";
  const [action, setAction] = useState(""),
    [form, setForm] = useState<Obj>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [id]);
  if (!o)
    return (
      <>
        <ErrorBox>{loadError}</ErrorBox>
        <Loading />
      </>
    );
  const perform = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setO(await api(`admin/orders/${id}/${action}`, form));
      setAction("");
      setToast(tx("Đã cập nhật đơn hàng"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const open = (a: string) => {
    setAction(a);
    setError("");
    setForm({
      request_key: crypto.randomUUID(),
      ...(a === "costs"
        ? { actual_shipping: o.actual_shipping, other_cost: o.other_cost }
        : a === "internal_note"
          ? { note: o.internal_note }
          : a === "refund"
            ? {
                amount: 0,
                shipping_reversal: 0,
                quantity: 0,
                item_id: o.items[0]?.id,
                reason: "",
              }
            : a === "cancel"
              ? { reason: tx("Khách yêu cầu") }
              : {}),
    });
  };
  const actions: Obj = {
    confirm: tx("Xác nhận đơn"),
    paid: tx("Xác nhận đã nhận đủ tiền"),
    prepare: tx("Đang chuẩn bị"),
    ship: tx("Bắt đầu giao"),
    deliver: tx("Giao thành công"),
    cancel: tx("Huỷ đơn"),
    costs: tx("Chi phí thực tế"),
    internal_note: tx("Ghi chú nội bộ"),
    shipping_quote: tx("Báo phí giao thủ công"),
    refund: tx("Hoàn tiền / trả hàng"),
  };
  return (
    <>
      <Link className="text-link" to="/admin/orders">
        <ArrowLeft size={14} />
        {tx(" Danh sách đơn")}
      </Link>
      <Heading
        title={o.code}
        description={tx("Đặt lúc {0} · {1}", [
          date(o.created_at),
          o.customer_name,
        ])}
      >
        <Badge tone={o.status === "cancelled" ? "red" : "lime"}>
          {status[o.status]}
        </Badge>
      </Heading>
      <div className="admin-order-grid">
        <div>
          <OrderWorkflow o={o} isAdmin={isAdmin} open={open} />
          <section className="panel">
            <h2>{tx("Thông tin giao hàng")}</h2>
            <p>
              <strong>{o.customer_name}</strong> · {o.phone}
            </p>
            <p>
              {o.address}, {o.region}
            </p>
            <p className="muted">
              {o.note || tx("Không có ghi chú từ khách.")}
            </p>
            <div className="admin-detail-line">
              <span>{tx("Quãng đường")}</span>
              <strong>
                {o.distance_km ? o.distance_km + " km" : tx("Chưa xác định")}
              </strong>
            </div>
            <div className="admin-detail-line">
              <span>{tx("Phí giao")}</span>
              <strong>{money(o.shipping_fee)}</strong>
            </div>
            <div className="admin-detail-line">
              <span>{tx("Xác nhận phí")}</span>
              <strong>
                {o.shipping_status === "confirmed"
                  ? tx("Đã xác nhận")
                  : o.shipping_status === "pending"
                    ? tx("Chờ báo phí")
                    : tx("Chờ khách đồng ý")}
              </strong>
            </div>
            <div className="notice">
              <MapPinIcon />
              <p>
                {o.latitude
                  ? `${o.latitude}, ${o.longitude}`
                  : tx("Khách chưa ghim vị trí")}
              </p>
            </div>
          </section>
          <section className="panel">
            <h2>{tx("Ghi chú nội bộ")}</h2>
            <p>{o.internal_note || tx("Chưa có ghi chú.")}</p>
            {isAdmin && (
              <>
                <div className="admin-detail-line">
                  <span>{tx("Phí giao thực trả")}</span>
                  <strong>{money(o.actual_shipping)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>{tx("Chi phí khác")}</span>
                  <strong>{money(o.other_cost)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>{tx("Tiền thực thu")}</span>
                  <strong>{money(o.paid_amount)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>{tx("Đã hoàn tiền")}</span>
                  <strong>{money(o.refunded_amount)}</strong>
                </div>
              </>
            )}
          </section>
          <section className="panel">
            <h2>{tx("Lịch sử thao tác")}</h2>
            {o.history.map((h: Obj, i: number) => (
              <div className="history-line" key={i}>
                <span>{actions[h.action] || h.action}</span>
                <small>
                  {date(h.created_at)} · {h.actor} · {h.channel}
                </small>
                <small className="audit-detail">{h.detail}</small>
              </div>
            ))}
          </section>
        </div>
        <Receipt o={o} />
      </div>
      {action && (
        <Modal title={actions[action]} onClose={() => setAction("")}>
          <form onSubmit={perform} className="stack">
            {["confirm", "paid", "prepare", "ship", "deliver"].includes(
              action,
            ) && (
              <p>
                {tx("Xác nhận thực hiện “")}
                {actions[action]}
                {tx("” cho đơn ")}
                {o.code}?{" "}
                {action === "paid" &&
                  tx("Chỉ xác nhận khi đã thực nhận đủ tiền.")}
              </p>
            )}
            {action === "cancel" && (
              <>
                <Field label={tx("Lý do huỷ")}>
                  <select
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  >
                    {[
                      tx("Khách yêu cầu"),
                      tx("Hết hàng"),
                      tx("Không liên hệ được"),
                      tx("Ngoài phạm vi giao"),
                      tx("Lý do khác"),
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                {![
                  tx("Khách yêu cầu"),
                  tx("Hết hàng"),
                  tx("Không liên hệ được"),
                  tx("Ngoài phạm vi giao"),
                ].includes(form.reason) && (
                  <Field label={tx("Nhập lý do")}>
                    <input
                      required
                      value={
                        form.reason === tx("Lý do khác") ? "" : form.reason
                      }
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                    />
                  </Field>
                )}
                <p className="muted small">
                  {tx(
                    "Tồn kho được trả lại một lần. Nếu đã thu tiền, thực hiện hoàn tiền riêng.",
                  )}
                </p>
              </>
            )}
            {action === "costs" && (
              <div className="form-grid">
                {[
                  ["actual_shipping", tx("Phí giao thực trả")],
                  ["other_cost", tx("Chi phí khác")],
                ].map(([k, l]) => (
                  <Field key={k} label={l + " (VND)"}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={form[k]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: Number(e.target.value) })
                      }
                    />
                  </Field>
                ))}
              </div>
            )}
            {action === "internal_note" && (
              <Field label={tx("Ghi chú chỉ nội bộ nhìn thấy")}>
                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </Field>
            )}
            {action === "shipping_quote" && (
              <>
                <Field label={tx("Phí giao báo khách (VND)")}>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.shipping_fee ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, shipping_fee: Number(e.target.value) })
                    }
                  />
                </Field>
                <p className="muted small">
                  {tx("Khách cần mở link theo dõi và chấp nhận tổng tiền mới.")}
                </p>
              </>
            )}
            {action === "refund" && (
              <>
                <Field
                  label={tx("Giảm doanh thu phí giao (VND, nếu hoàn phí ship)")}
                >
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.shipping_reversal}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shipping_reversal: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label={tx("Số tiền thực hoàn (VND)")}>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={tx("Dòng hàng trả (chỉ đơn đã giao)")}>
                  <select
                    value={form.item_id}
                    onChange={(e) =>
                      setForm({ ...form, item_id: Number(e.target.value) })
                    }
                  >
                    {o.items.map((i: Obj) => (
                      <option key={i.id} value={i.id}>
                        {i.product_name}
                        {tx(" · Đã trả ")}
                        {i.returned_quantity}/{i.quantity}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={tx("Số lượng nhập lại kho (0 nếu chỉ hoàn tiền)")}
                >
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={tx("Lý do")}>
                  <textarea
                    required
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  />
                </Field>
                <p className="muted small">
                  {tx(
                    "Trả hàng điều chỉnh doanh thu và giá vốn theo snapshot. Hoàn tiền chỉ điều chỉnh thực thu, không trừ doanh thu lần hai. Chỉ nhập lại kho hàng thực sự nhận lại.",
                  )}
                </p>
              </>
            )}
            <ErrorBox>{error}</ErrorBox>
            <Button
              loading={busy}
              variant={action === "cancel" ? "danger" : "dark"}
            >
              {tx("Xác nhận thao tác")}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
function MapPinIcon() {
  return <Truck size={16} />;
}
function Products() {
  const { data, error, load } = useLoad("admin/products");
  const [edit, setEdit] = useState<Obj | null>(null),
    [q, setQ] = useState("");
  return (
    <>
      <Heading
        title={tx("Sản phẩm")}
        description={tx("Chăm chút danh mục, giá bán và tồn kho.")}
      >
        <Button
          variant="dark"
          onClick={() =>
            setEdit({
              name: "",
              slug: "",
              brand: "OD.",
              category_id: data?.categories[0]?.id || 1,
              description: "",
              images: [],
              active: 1,
              featured: 0,
              pinned: 0,
              sort_order: 0,
              flash_price: "",
              flash_start: "",
              flash_end: "",
              variants: [
                {
                  sku: "",
                  name: tx("Mặc định"),
                  price: 0,
                  cost: 0,
                  stock: 0,
                  active: 1,
                },
              ],
            })
          }
        >
          <Plus size={16} />
          {tx(" Thêm sản phẩm")}
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              aria-label={tx("Tìm sản phẩm quản trị")}
              placeholder={tx("Tìm tên hoặc SKU…")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="muted small">
            {data?.products.length || 0}
            {tx(" sản phẩm")}
          </span>
        </div>
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                {[
                  tx("Sản phẩm"),
                  tx("Danh mục"),
                  tx("Giá bán"),
                  tx("Giá vốn"),
                  tx("Tồn kho"),
                  tx("Trạng thái"),
                  "",
                ].map((x, i) => (
                  <th key={i}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products
                .filter((p: Obj) =>
                  `${p.name} ${p.variants.map((v: Obj) => v.sku)}`
                    .toLowerCase()
                    .includes(q.toLowerCase()),
                )
                .map((p: Obj) => (
                  <tr key={p.id}>
                    <td data-label={tx("Sản phẩm")}>
                      <div className="table-product">
                        {p.images[0] && <img src={asset(p.images[0])} alt="" />}
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.variants[0]?.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label={tx("Danh mục")}>{p.category}</td>
                    <td data-label={tx("Giá bán")}>
                      {money(p.variants[0]?.price)}
                    </td>
                    <td data-label={tx("Giá vốn")}>
                      {money(p.variants[0]?.cost)}
                    </td>
                    <td data-label={tx("Tồn kho")}>
                      {p.variants.reduce(
                        (s: number, v: Obj) => s + Number(v.stock),
                        0,
                      )}
                    </td>
                    <td data-label={tx("Trạng thái")}>
                      <Badge tone={p.active == 1 ? "lime" : ""}>
                        {p.active == 1 ? tx("Đang bán") : tx("Ngừng bán")}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={tx("Sửa ") + p.name}
                        onClick={() => setEdit(structuredClone(p))}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <Loading />
        )}
      </section>
      {edit && (
        <ProductEditor
          product={edit}
          categories={data?.categories || []}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function ProductEditor({ product, categories, onClose, onSaved }: any) {
  const [f, setF] = useState<Obj>(product),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (k: string, v: any) => setF({ ...f, [k]: v });
  const { refresh } = useStore();
  return (
    <Modal
      title={f.id ? tx("Sửa sản phẩm") : tx("Thêm sản phẩm")}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const prefix = (f.slug || slugify(f.name) || "SP")
              .toUpperCase()
              .slice(0, 45);
            const suffix =
              f.id || crypto.randomUUID().slice(0, 6).toUpperCase();
            await api("admin/products", {
              ...f,
              slug: f.slug || slugify(f.name),
              variants: f.variants.map((v: Obj, i: number) => ({
                ...v,
                sku: v.sku.trim() || `${prefix}-${suffix}-${i + 1}`,
              })),
            });
            refresh();
            onSaved();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          {[
            ["name", tx("Tên sản phẩm")],
            ["slug", tx("Slug (a-z, số, dấu -)")],
            ["brand", tx("Thương hiệu")],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input
                required
                value={f[k]}
                onChange={(e) =>
                  k === "name" && !f.id
                    ? setF({
                        ...f,
                        name: e.target.value,
                        slug: slugify(e.target.value),
                      })
                    : change(k, e.target.value)
                }
              />
            </Field>
          ))}
          <Field label={tx("Danh mục")}>
            <select
              value={f.category_id}
              onChange={(e) => change("category_id", Number(e.target.value))}
            >
              {categories.map((c: Obj) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={tx("Mô tả")}>
          <textarea
            rows={4}
            value={f.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <ContentTranslations
          value={f.translations}
          onChange={(v) => change("translations", v)}
        />
        <div className="images-editor">
          {f.images.map((s: string, i: number) => (
            <div key={i}>
              <img src={asset(s)} alt="" />
              <button
                type="button"
                aria-label={tx("Xoá ảnh")}
                onClick={() =>
                  change(
                    "images",
                    f.images.filter((_: any, n: number) => i !== n),
                  )
                }
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <Field label={tx("Thêm ảnh JPG, PNG hoặc WebP (tối đa 5MB)")}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                try {
                  const path = await upload(e.target.files[0]);
                  change("images", [...f.images, path]);
                } catch (e: any) {
                  setError(e.message);
                }
              }
            }}
          />
        </Field>
        <div className="toolbar">
          {[
            ["active", tx("Đang bán")],
            ["featured", tx("Nổi bật")],
            ["pinned", tx("Ghim sản phẩm")],
          ].map(([k, l]) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={!!Number(f[k])}
                onChange={(e) => change(k, e.target.checked ? 1 : 0)}
              />
              {l}
            </label>
          ))}
          <Field label={tx("Thứ tự")}>
            <input
              type="number"
              min="0"
              value={f.sort_order}
              onChange={(e) => change("sort_order", Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="product-help">
          <h3>{tx("Bán một mẫu hay nhiều lựa chọn?")}</h3>
          <p>
            <b>{tx("Một mẫu:")}</b>
            {tx(
              " giữ dòng “Mặc định”, nhập giá bán, giá vốn và số lượng còn trong kho là xong.",
            )}
          </p>
          <p>
            <b>{tx("Nhiều màu / cấu hình:")}</b>
            {tx(
              " thêm mỗi lựa chọn thành một biến thể, ví dụ “Đen”, “Trắng” hoặc “Bluetooth”. Mỗi biến thể có giá và tồn kho riêng.",
            )}
          </p>
          <details>
            <summary>{tx("SKU và đường dẫn sản phẩm là gì?")}</summary>
            <p>
              {tx(
                "SKU là mã kho để phân biệt từng mẫu, ví dụ H1-DEN. Có thể để trống, hệ thống tự tạo mã riêng. Slug là phần chữ trong đường dẫn, tự điền theo tên sản phẩm. Giá vốn chỉ dùng cho báo cáo nội bộ.",
              )}
            </p>
          </details>
        </div>
        <h3>{tx("Giá & tồn kho theo lựa chọn")}</h3>
        {f.variants.map((v: Obj, i: number) => (
          <div className="variant-editor" key={i}>
            <div className="form-grid">
              {[
                ["sku", tx("Mã kho SKU (để trống để tự tạo)"), "text"],
                ["name", tx("Tên biến thể"), "text"],
                ["price", tx("Giá bán (VND)"), "number"],
                ["cost", tx("Giá vốn (VND)"), "number"],
                ["stock", tx("Tồn kho khả dụng"), "number"],
              ].map(([k, l, t]) => (
                <Field key={k} label={l}>
                  <input
                    type={t}
                    min="0"
                    required={k !== "sku"}
                    value={v[k]}
                    onChange={(e) =>
                      change(
                        "variants",
                        f.variants.map((x: Obj, n: number) =>
                          n === i
                            ? {
                                ...x,
                                [k]:
                                  t === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </Field>
              ))}
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!Number(v.active)}
                  onChange={(e) =>
                    change(
                      "variants",
                      f.variants.map((x: Obj, n: number) =>
                        n === i
                          ? { ...x, active: e.target.checked ? 1 : 0 }
                          : x,
                      ),
                    )
                  }
                />{" "}
                {tx("Đang bán biến thể")}
              </label>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            change("variants", [
              ...f.variants,
              { sku: "", name: "", price: 0, cost: 0, stock: 0, active: 1 },
            ])
          }
        >
          <Plus size={14} />
          {tx(" Thêm biến thể")}
        </Button>
        <div className="form-divider">
          <h3>{tx("Flash sale (bỏ giá trống để tắt)")}</h3>
          <div className="form-grid">
            <Field label={tx("Giá flash sale (VND)")}>
              <input
                type="number"
                min="0"
                value={f.flash_price ?? ""}
                onChange={(e) =>
                  change(
                    "flash_price",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
            {[
              ["flash_start", tx("Bắt đầu")],
              ["flash_end", tx("Kết thúc")],
            ].map(([k, l]) => (
              <Field key={k} label={l + tx(" · giờ Việt Nam")}>
                <input
                  type="datetime-local"
                  value={f[k]?.replace(" ", "T") || ""}
                  onChange={(e) => change(k, e.target.value.replace("T", " "))}
                />
              </Field>
            ))}
          </div>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <Button variant="dark full" loading={busy}>
          {tx("Lưu sản phẩm")}
        </Button>
      </form>
    </Modal>
  );
}
function Categories() {
  const { data, error, load } = useLoad("admin/categories");
  const [edit, setEdit] = useState<Obj | null>(null);
  return (
    <>
      <Heading
        title={tx("Danh mục")}
        description={tx("Tổ chức sản phẩm để khách dễ tìm.")}
      >
        <Button
          variant="dark"
          onClick={() => setEdit({ name: "", slug: "", sort_order: 0 })}
        >
          <Plus size={16} />
          {tx(" Thêm danh mục")}
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>{tx("Tên")}</th>
                <th>Slug</th>
                <th>{tx("Thứ tự")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c: Obj) => (
                <tr key={c.id}>
                  <td data-label={tx("Tên")}>{c.name}</td>
                  <td data-label="Slug">{c.slug}</td>
                  <td data-label={tx("Thứ tự")}>{c.sort_order}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={tx("Sửa danh mục")}
                      onClick={() => setEdit(c)}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Loading />
        )}
      </section>
      {edit && (
        <SimpleEditor
          title={tx("Danh mục")}
          initial={edit}
          route="admin/categories"
          fields={[
            ["name", tx("Tên"), "text"],
            ["slug", "Slug", "text"],
            ["sort_order", tx("Thứ tự"), "number"],
          ]}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}
function SimpleEditor({
  title,
  initial,
  route,
  fields,
  onClose,
  onSaved,
}: any) {
  const [f, setF] = useState<Obj>(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(route, f);
            onSaved();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {fields.map(([k, label, type, options]: any) =>
          type === "checkbox" ? (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={!!Number(f[k])}
                onChange={(e) => setF({ ...f, [k]: e.target.checked ? 1 : 0 })}
              />
              {label}
            </label>
          ) : (
            <Field key={k} label={label}>
              {type === "select" ? (
                <select
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                >
                  {options.map(([v, l]: any) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  min={type === "number" ? 0 : undefined}
                  required={type !== "password" || !f.id}
                  value={
                    type === "datetime-local"
                      ? (f[k] || "").replace(" ", "T")
                      : (f[k] ?? "")
                  }
                  onChange={(e) =>
                    setF({
                      ...f,
                      [k]:
                        type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : type === "datetime-local"
                            ? e.target.value.replace("T", " ")
                            : e.target.value,
                    })
                  }
                />
              )}
            </Field>
          ),
        )}
        {route === "admin/categories" && (
          <ContentTranslations
            category
            value={f.translations}
            onChange={(v) => setF({ ...f, translations: v })}
          />
        )}
        <ErrorBox>{error}</ErrorBox>
        <Button loading={busy} variant="dark full">
          {tx("Lưu")}
        </Button>
      </form>
    </Modal>
  );
}
function Coupons() {
  const { data, error, load } = useLoad("admin/coupons");
  const [edit, setEdit] = useState<Obj | null>(null);
  return (
    <>
      <Heading
        title={tx("Mã giảm giá")}
        description={tx("Điều kiện, thời gian và giới hạn sử dụng rõ ràng.")}
      >
        <Button
          variant="dark"
          onClick={() =>
            setEdit({
              code: "",
              type: "percent",
              value: 10,
              min_total: 0,
              max_discount: "",
              max_uses: 100,
              starts_at: today() + " 00:00",
              ends_at: today() + " 23:59",
              active: 1,
            })
          }
        >
          <Plus size={16} />
          {tx(" Thêm mã")}
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <div className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                {[
                  tx("Mã"),
                  tx("Mức giảm"),
                  tx("Đơn tối thiểu"),
                  tx("Lượt dùng"),
                  tx("Hết hạn"),
                  "",
                ].map((s, i) => (
                  <th key={i}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((c: Obj) => (
                <tr key={c.code}>
                  <td data-label={tx("Mã")}>
                    <strong>{c.code}</strong>
                  </td>
                  <td data-label={tx("Mức giảm")}>
                    {c.type === "percent" ? c.value + "%" : money(c.value)}
                  </td>
                  <td data-label={tx("Đơn tối thiểu")}>{money(c.min_total)}</td>
                  <td data-label={tx("Lượt dùng")}>
                    {c.uses}/{c.max_uses}
                  </td>
                  <td data-label={tx("Hết hạn")}>{date(c.ends_at)}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={tx("Sửa mã")}
                      onClick={() => setEdit(c)}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Loading />
        )}
      </div>
      {edit && (
        <SimpleEditor
          title={tx("Thiết lập mã giảm giá")}
          initial={edit}
          route="admin/coupons"
          fields={[
            ["code", tx("Mã"), "text"],
            [
              "type",
              tx("Loại giảm"),
              "select",
              [
                ["percent", tx("Phần trăm")],
                ["fixed", tx("Số tiền cố định")],
              ],
            ],
            ["value", tx("Giá trị"), "number"],
            ["min_total", tx("Đơn tối thiểu (VND)"), "number"],
            ["max_discount", tx("Giảm tối đa (VND, 0 = không giảm)"), "number"],
            ["max_uses", tx("Lượt dùng tối đa"), "number"],
            ["starts_at", tx("Bắt đầu · giờ Việt Nam"), "datetime-local"],
            ["ends_at", tx("Kết thúc · giờ Việt Nam"), "datetime-local"],
            ["active", tx("Đang kích hoạt"), "checkbox"],
          ]}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}
function Reports() {
  const [from, setFrom] = useState(today().slice(0, 7) + "-01"),
    [to, setTo] = useState(today()),
    [filter, setFilter] = useState("");
  const { data: r, error } = useLoad(
    `admin/report?from=${from}&to=${to}&status=${filter}`,
  );
  const [pdfBusy, setPdfBusy] = useState(false),
    [pdfError, setPdfError] = useState("");
  const keys = [
    "revenue",
    "cost",
    "gross",
    "shipping_collected",
    "actual_shipping",
    "other_cost",
    "profit",
    "cash",
    "receivable",
  ];
  const labels = [
    tx("Doanh thu thuần"),
    tx("Giá vốn"),
    tx("Lãi gộp"),
    tx("Ship thu khách"),
    tx("Giao thực trả"),
    tx("Chi phí khác"),
    tx("Lãi sau chi phí"),
    tx("Tiền thực thu ròng"),
    tx("Công nợ"),
  ];
  const quick = (type: string) => {
    const d = new Date(today() + "T00:00:00Z");
    const end = today();
    if (type === "today") {
      setFrom(end);
      setTo(end);
    } else if (type === "week") {
      const offset = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - offset);
      setFrom(d.toISOString().slice(0, 10));
      setTo(end);
    } else {
      setFrom(end.slice(0, 7) + "-01");
      setTo(end);
    }
  };
  return (
    <>
      <Heading
        title={tx("Báo cáo bán hàng")}
        description={tx("Doanh thu, giá vốn và lãi/lỗ từ dữ liệu đơn thực tế.")}
      >
        <div className="toolbar" style={{ margin: 0 }}>
          <Button
            variant="outline"
            disabled={!r}
            onClick={() =>
              csv(`Bao-cao-${from}-${to}.csv`, [
                [tx("Mã đơn"), tx("Ngày đặt"), tx("Trạng thái"), ...labels],
                ...r.rows.map((o: Obj) => [
                  o.code,
                  o.created_at,
                  status[o.status],
                  ...keys.map((k) => o[k]),
                ]),
                [tx("TỔNG"), "", "", ...keys.map((k) => r.totals[k])],
              ])
            }
          >
            <Download size={15} /> Excel / CSV
          </Button>
          <Button
            variant="dark"
            disabled={!r}
            loading={pdfBusy}
            onClick={async () => {
              setPdfBusy(true);
              try {
                await (await import("./pdf")).reportPDF(r);
              } catch {
                setPdfError(tx("Không tạo được PDF. Vui lòng thử lại."));
              } finally {
                setPdfBusy(false);
              }
            }}
          >
            <Download size={15} /> PDF
          </Button>
        </div>
      </Heading>
      <div className="panel">
        <div className="toolbar">
          <Button variant="outline" onClick={() => quick("today")}>
            {tx("Hôm nay")}
          </Button>
          <Button variant="outline" onClick={() => quick("week")}>
            {tx("Tuần này")}
          </Button>
          <Button variant="outline" onClick={() => quick("month")}>
            {tx("Tháng này")}
          </Button>
          <input
            type="date"
            aria-label={tx("Báo cáo từ ngày")}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            aria-label={tx("Báo cáo đến ngày")}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <select
            aria-label={tx("Trạng thái báo cáo")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">{tx("Mọi trạng thái")}</option>
            {[
              "received",
              "confirmed",
              "preparing",
              "shipping",
              "delivered",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {status[s]}
              </option>
            ))}
          </select>
        </div>
        <p className="report-note">
          {r?.basis}
          {tx(
            " Múi giờ Asia/Ho_Chi_Minh. Tiền thực thu = đã nhận − đã hoàn; hoàn tiền không trừ doanh thu lần hai. Trả hàng điều chỉnh doanh thu và giá vốn theo từng dòng hàng.",
          )}
        </p>
      </div>
      <ErrorBox>{error || pdfError}</ErrorBox>
      {r ? (
        <>
          <div className="stats-grid">
            {keys.map((k, i) => (
              <Stat
                key={k}
                label={labels[i]}
                value={money(r.totals[k])}
                note={
                  i === 6
                    ? tx("Lãi gộp + ship thu − giao thực − chi phí khác")
                    : tx("Theo bộ lọc hiện tại")
                }
                primary={i === 0 || i === 6}
              />
            ))}
          </div>
          <section className="panel">
            <div className="panel-title">
              <h2>{tx("Bảng kê từng đơn")}</h2>
              <Badge>
                {r.rows.length}
                {tx(" đơn")}
              </Badge>
            </div>
            <div className="table-wrap">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{tx("Mã đơn")}</th>
                    <th>{tx("Trạng thái")}</th>
                    {labels.map((l) => (
                      <th key={l}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((o: Obj) => (
                    <tr key={o.id}>
                      <td data-label={tx("Mã đơn")}>
                        <Link to={"/admin/orders/" + o.id}>
                          <strong>{o.code}</strong>
                        </Link>
                      </td>
                      <td data-label={tx("Trạng thái")}>{status[o.status]}</td>
                      {keys.map((k, i) => (
                        <td key={k} data-label={labels[i]}>
                          {money(o[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td data-label={tx("Tổng")}>
                      <strong>{tx("TỔNG")}</strong>
                    </td>
                    <td />
                    {keys.map((k, i) => (
                      <td key={k} data-label={labels[i]}>
                        <strong>{money(r.totals[k])}</strong>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {!r.rows.length && (
              <p className="report-note">
                {tx("Chưa có đơn trong khoảng ngày đã chọn.")}
              </p>
            )}
          </section>
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
function StoreSettings() {
  const { data, error, load } = useLoad("admin/settings");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "store";
  const setTab = (value: string) => setParams({ tab: value });
  return (
    <>
      <Heading
        title={tx("Thiết lập cửa hàng")}
        description={tx("Thông tin, giao hàng, thanh toán và Telegram.")}
      />
      <div className="settings-tabs">
        {[
          ["store", tx("Cửa hàng")],
          ["appearance", tx("Banner & thương hiệu")],
          ["seo", "SEO website"],
          ["shipping", tx("Vận chuyển")],
          ["payment", tx("Thanh toán")],
          ["telegram", "Telegram"],
          ["maps", tx("Bản đồ & kết nối")],
        ].map(([k, l]) => (
          <button
            className={tab === k ? "active" : ""}
            key={k}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      <ErrorBox>{error}</ErrorBox>
      {tab === "appearance" ? (
        <ContentSettings />
      ) : tab === "seo" ? (
        <SeoSettings />
      ) : tab === "maps" ? (
        <MapsSettings />
      ) : data ? (
        <SettingsForm
          key={tab + JSON.stringify(data[tab])}
          tab={tab}
          data={data}
          reload={load}
        />
      ) : (
        <Loading />
      )}
    </>
  );
}
function SettingsForm({ tab, data, reload }: any) {
  const [f, setF] = useState<Obj>(structuredClone(data[tab])),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const { refresh } = useStore();
  const fields: Obj = {
    store: [
      ["name", tx("Tên cửa hàng"), "text"],
      ["address", tx("Địa chỉ"), "text"],
      ["phone", tx("Điện thoại"), "text"],
      ["email", tx("Email hỗ trợ"), "email"],
      ["banner", tx("Nội dung giới thiệu"), "text"],
    ],
    shipping: [
      ["base_fee", tx("Phí cơ bản (VND)"), "number"],
      ["included_km", tx("Số km bao gồm"), "number"],
      ["per_km", tx("Giá mỗi km thêm (VND)"), "number"],
      ["max_km", tx("Khoảng cách tối đa (km)"), "number"],
      ["free_above", tx("Miễn ship từ tiền hàng ròng (0 = tắt)"), "number"],
      ["round_step", tx("Bước làm tròn (km)"), "number"],
    ],
    payment: [
      ["cod", tx("Bật COD"), "checkbox"],
      ["bank", tx("Bật chuyển khoản"), "checkbox"],
      ["demo", tx("Dữ liệu ngân hàng demo"), "checkbox"],
      ["bank_bin", tx("Mã BIN ngân hàng"), "text"],
      ["bank_account", tx("Số tài khoản"), "text"],
      ["bank_owner", tx("Chủ tài khoản"), "text"],
      [
        "transfer_template",
        tx("Mẫu nội dung chuyển khoản, cần {code}"),
        "text",
      ],
      ["instructions", tx("Hướng dẫn thanh toán"), "text"],
    ],
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (tab === "telegram") await api("admin/telegram/config", f);
      else await api("admin/settings", { key: tab, value: f });
      setSuccess(true);
      refresh();
      reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <form className="panel settings-form" onSubmit={save}>
        <h2>
          {
            (
              {
                store: tx("Thông tin & nội dung"),
                shipping: tx("Quy tắc giao hàng"),
                payment: tx("Phương thức thanh toán"),
                telegram: tx("Kết nối Telegram"),
              } as Obj
            )[tab]
          }
        </h2>
        {tab === "shipping" && (
          <div className="shipping-origin-editor">
            <Field label={tx("Địa chỉ xuất phát giao hàng")}>
              <AddressSearch
                value={f.origin_address || ""}
                region=""
                selected={Boolean(
                  f.origin_address && f.origin_lat && f.origin_lng,
                )}
                onChange={(value) =>
                  setF({
                    ...f,
                    origin_address: value,
                    origin_lat: "",
                    origin_lng: "",
                  })
                }
                onSelect={(place) =>
                  setF({
                    ...f,
                    origin_address: place.label,
                    origin_lat: place.latitude,
                    origin_lng: place.longitude,
                  })
                }
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={Boolean(f.routing_enabled)}
                onChange={(e) =>
                  setF({ ...f, routing_enabled: e.target.checked })
                }
              />{" "}
              {tx("Tự tính phí giao theo quãng đường xe chạy")}
            </label>
            <p className="report-note">
              {tx(
                "Chọn đúng địa chỉ cửa hàng trước khi bật. Khi dịch vụ đường đi lỗi, đơn chờ xác nhận phí giao.",
              )}
            </p>
          </div>
        )}
        {tab !== "telegram" ? (
          <div className="form-grid">
            {fields[tab].map(([k, l, t]: any) =>
              t === "checkbox" ? (
                <label className="check" key={k}>
                  <input
                    type="checkbox"
                    checked={!!f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.checked })}
                  />
                  {l}
                </label>
              ) : (
                <Field key={k} label={l}>
                  <input
                    type={t}
                    step={t === "number" ? "any" : undefined}
                    value={f[k]}
                    onChange={(e) =>
                      setF({
                        ...f,
                        [k]:
                          t === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                </Field>
              ),
            )}
            {tab === "shipping" && (
              <Field label={tx("Cách làm tròn phần km thêm")}>
                <select
                  value={f.round_mode}
                  onChange={(e) => setF({ ...f, round_mode: e.target.value })}
                >
                  <option value="ceil">{tx("Làm tròn lên")}</option>
                  <option value="nearest">{tx("Làm tròn gần nhất")}</option>
                  <option value="exact">{tx("Không làm tròn km")}</option>
                </select>
              </Field>
            )}
          </div>
        ) : (
          <>
            <Badge tone={f.configured ? "lime" : ""}>
              {f.configured
                ? tx("Đã cấu hình token")
                : tx("Chưa cấu hình token")}
            </Badge>
            <p className="report-note">
              {tx(
                "Bot token và webhook secret được mã hoá trong database, không trả về trình duyệt. Lưu xong bấm Đăng ký webhook bên dưới.",
              )}
            </p>
            <Field label={tx("Bot token mới (để trống giữ nguyên)")}>
              <input
                type="password"
                autoComplete="new-password"
                value={f.token || ""}
                onChange={(e) => setF({ ...f, token: e.target.value })}
              />
            </Field>
            <Field
              label={tx(
                "Webhook secret mới (ít nhất 32 ký tự, để trống giữ nguyên)",
              )}
            >
              <input
                type="password"
                autoComplete="new-password"
                value={f.secret || ""}
                onChange={(e) => setF({ ...f, secret: e.target.value })}
              />
            </Field>
            <Field label={tx("Chat ID được phép")}>
              <input
                value={f.chat_id}
                onChange={(e) => setF({ ...f, chat_id: e.target.value })}
              />
            </Field>
            <Field
              label={tx("Telegram User ID được phép, phân cách bằng dấu phẩy")}
            >
              <input
                value={
                  Array.isArray(f.allowed_users)
                    ? f.allowed_users.join(",")
                    : f.allowed_users
                }
                onChange={(e) => setF({ ...f, allowed_users: e.target.value })}
              />
            </Field>
            <p className="report-note">Webhook: {f.webhook}</p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api("admin/telegram/webhook", {});
                  setSuccess(true);
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
              loading={busy}
            >
              {tx("Đăng ký webhook")}
            </Button>
          </>
        )}
        {tab === "shipping" && (
          <div className="notice">
            <Truck size={17} />
            <p>
              {tx(
                "Ví dụ 15.000đ / 3km đầu + 5.000đ/km → 5km = 25.000đ. Routing cần bật trong config.php. Không có quãng đường sẽ chờ báo phí thủ công.",
              )}
            </p>
          </div>
        )}
        {tab === "payment" && (
          <p className="report-note">
            {tx(
              "VietQR chỉ tạo mã thanh toán theo số tiền, không kết nối xác thực ngân hàng. Chuyển khoản luôn cần xác nhận thủ công.",
            )}
          </p>
        )}
        <ErrorBox>{error}</ErrorBox>
        {success && <Success>{tx("Đã lưu thiết lập.")}</Success>}
        <Button loading={busy} variant="dark">
          {tx("Lưu thay đổi")}
        </Button>
      </form>
      {tab === "telegram" && (
        <section className="panel">
          <div className="panel-title">
            <h2>{tx("Hàng đợi gửi thông báo")}</h2>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api("admin/telegram/retry", {});
                  reload();
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <RefreshCw size={15} />
              {tx(" Thử lại")}
            </Button>
          </div>
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>{tx("ID đơn")}</th>
                  <th>{tx("Trạng thái")}</th>
                  <th>{tx("Số lần")}</th>
                  <th>{tx("Lỗi")}</th>
                  <th>{tx("Lần tiếp")}</th>
                </tr>
              </thead>
              <tbody>
                {data.outbox.map((o: Obj) => (
                  <tr key={o.id}>
                    <td data-label={tx("ID đơn")}>{o.order_id}</td>
                    <td data-label={tx("Trạng thái")}>{o.state}</td>
                    <td data-label={tx("Số lần")}>{o.attempts}</td>
                    <td data-label={tx("Lỗi")}>{o.last_error || "—"}</td>
                    <td data-label={tx("Lần tiếp")}>{o.next_attempt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
function Staff() {
  const { data, error, load } = useLoad("admin/users");
  const [edit, setEdit] = useState<Obj | null>(null);
  return (
    <>
      <Heading
        title={tx("Nhân viên & phân quyền")}
        description={tx(
          "Quản trị viên quản lý toàn bộ; nhân viên chỉ xử lý đơn.",
        )}
      >
        <Button
          variant="dark"
          onClick={() =>
            setEdit({
              name: "",
              email: "",
              password: "",
              role: "staff",
              active: 1,
            })
          }
        >
          <Plus size={16} />
          {tx(" Thêm tài khoản")}
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>{tx("Họ tên")}</th>
                <th>Email</th>
                <th>{tx("Vai trò")}</th>
                <th>{tx("Trạng thái")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((u: Obj) => (
                <tr key={u.id}>
                  <td data-label={tx("Họ tên")}>{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label={tx("Vai trò")}>
                    {u.role === "admin" ? tx("Quản trị viên") : tx("Nhân viên")}
                  </td>
                  <td data-label={tx("Trạng thái")}>
                    <Badge tone={u.active == 1 ? "lime" : ""}>
                      {u.active == 1 ? tx("Hoạt động") : tx("Đã khoá")}
                    </Badge>
                  </td>
                  <td>
                    <button
                      aria-label={tx("Sửa tài khoản")}
                      className="icon-button"
                      onClick={() => setEdit({ ...u, password: "" })}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Loading />
        )}
      </section>
      {edit && (
        <SimpleEditor
          title={tx("Tài khoản nhân viên")}
          initial={edit}
          route="admin/users"
          fields={[
            ["name", tx("Họ tên"), "text"],
            ["email", "Email", "email"],
            [
              "password",
              tx("Mật khẩu (ít nhất 12 ký tự; trống giữ nguyên)"),
              "password",
            ],
            [
              "role",
              tx("Vai trò"),
              "select",
              [
                ["staff", tx("Nhân viên")],
                ["admin", tx("Quản trị viên")],
              ],
            ],
            ["active", tx("Đang hoạt động"), "checkbox"],
          ]}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}
function Audit() {
  const { data, error } = useLoad("admin/audit");
  return (
    <>
      <Heading
        title={tx("Lịch sử thao tác")}
        description={tx("Ai thay đổi gì, lúc nào và qua kênh nào.")}
      />
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  {[
                    tx("Thời gian"),
                    tx("Người thực hiện"),
                    tx("Kênh"),
                    tx("Thao tác"),
                    tx("Chi tiết"),
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((a: Obj) => (
                  <tr key={a.id}>
                    <td data-label={tx("Thời gian")}>{date(a.created_at)}</td>
                    <td data-label={tx("Người thực hiện")}>{a.actor}</td>
                    <td data-label={tx("Kênh")}>{a.channel}</td>
                    <td data-label={tx("Thao tác")}>{a.action}</td>
                    <td data-label={tx("Chi tiết")} className="audit-detail">
                      {a.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Loading />
        )}
      </section>
    </>
  );
}
