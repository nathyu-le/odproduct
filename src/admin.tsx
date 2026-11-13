import { AddressSearch } from "./address-search";
import { AdminDashboard } from "./admin-dashboard";
import { AdminFlashSales } from "./admin-flash-sales";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ChartNoAxesCombined,
  Settings,
  Users,
  LogOut,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Download,
  RefreshCw,
  Tag,
  History,
  Menu,
  X,
  Truck,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Upload,
  ExternalLink,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { api, asset, money, date, status, upload, type Obj } from "./api";
import { useStore } from "./context";
import {
  Button,
  Badge,
  Field,
  Loading,
  ErrorBox,
  Empty,
  Modal,
  Success,
} from "./ui";
import { Receipt } from "./store";
import { csv } from "./csv";
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
  const { session, setSession } = useStore();
  const [menu, setMenu] = useState(false);
  if (!session) return <Loading />;
  if (!session.user) return <Login />;
  const u = session.user;
  const links = [
    ["", "Tổng quan", LayoutDashboard],
    ["orders", "Đơn hàng", ShoppingBag],
    ...(u.role === "admin"
      ? [
          ["products", "Sản phẩm", Package],
          ["flash-sales", "Flash sale", Zap],
          ["categories", "Danh mục", Tag],
          ["coupons", "Mã giảm giá", Tag],
          ["reports", "Báo cáo", ChartNoAxesCombined],
          ["settings", "Thiết lập", Settings],
          ["users", "Nhân viên", Users],
          ["audit", "Lịch sử thao tác", History],
        ]
      : []),
  ];
  return (
    <div className={"admin-layout " + (menu ? "menu-open" : "")}>
      <aside className="admin-sidebar">
        <button
          className="icon-button admin-sidebar-close"
          aria-label="Đóng menu quản trị"
          onClick={() => setMenu(false)}
        >
          <X size={16} />
        </button>
        <div className="admin-brand">
          <Link className="logo" to="/">
            od<span>.</span>
          </Link>
          <span>
            WORKSPACE
            <br />
            QUẢN TRỊ
          </span>
        </div>
        <div className="sidebar-label">CỬA HÀNG CỦA BẠN</div>
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
          KÊNH BÁN HÀNG
        </div>
        <nav>
          <Link to="/">
            <ExternalLink size={16} /> Xem cửa hàng
          </Link>
        </nav>
        <div className="admin-sidebar-bottom">
          <p>{u.name}</p>
          <small>{u.role === "admin" ? "Quản trị viên" : "Nhân viên"}</small>
          <button
            onClick={async () => {
              await api("logout", {});
              setSession(await api("session"));
            }}
          >
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <button
              className="icon-button admin-mobile-toggle"
              aria-label="Menu quản trị"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="lime-dot" />
            <span>OD. Store / Quản trị cửa hàng</span>
          </div>
          <div>
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
                <Empty title="Trang không khả dụng">
                  Tài khoản cần quyền quản trị viên cho chức năng này.
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
        <Link className="logo" to="/">
          od<span>.</span>
        </Link>
        <div className="panel">
          <p className="eyebrow">STORE WORKSPACE</p>
          <h1>Chào mừng trở lại.</h1>
          <p>Đăng nhập để chăm sóc cửa hàng của bạn.</p>
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
            <Field label="Mật khẩu">
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
              Đăng nhập <ArrowUpRight size={16} />
            </Button>
          </form>
          <p className="small" style={{ marginTop: 20 }}>
            Tài khoản đầu tiên được tạo trên trang cài đặt khi upload hosting.
            Không có mật khẩu mặc định.
          </p>
        </div>
        <Link className="text-link" to="/">
          <ArrowLeft size={14} /> Về cửa hàng
        </Link>
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
        title="Một ngày tốt lành 👋"
        description="Mọi hoạt động của cửa hàng, gọn trong một nơi."
      >
        <Link className="button outline" to="/">
          Xem cửa hàng <ArrowUpRight size={15} />
        </Link>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      {isAdmin && (
        <div className="stats-grid">
          <Stat
            label="Doanh thu thuần tháng này"
            value={money(r?.totals?.revenue || 0)}
            note="Chỉ đơn giao thành công"
            icon={Wallet}
            primary
          />
          <Stat
            label="Đơn hàng"
            value={r?.rows?.length || 0}
            note="Theo ngày đặt trong tháng"
            icon={ShoppingBag}
          />
          <Stat
            label="Lãi sau chi phí"
            value={money(r?.totals?.profit || 0)}
            note="Đã tính giá vốn và chi phí"
            icon={TrendingUp}
          />
          <Stat
            label="Công nợ còn lại"
            value={money(r?.totals?.receivable || 0)}
            note="Tách riêng tiền đã thực thu"
            icon={ChartNoAxesCombined}
          />
        </div>
      )}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Doanh thu trong tháng</h2>
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
                ? "Chưa có doanh thu được ghi nhận. Dữ liệu sẽ xuất hiện khi giao đơn thành công."
                : "Báo cáo tài chính dành cho quản trị viên."}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Việc cần chú ý</h2>
            <ShieldCheck size={17} strokeWidth={1.4} />
          </div>
          <div className="admin-detail-line">
            <span>Đơn chờ xác nhận (20 đơn gần nhất)</span>
            <strong>
              {orders?.orders.filter((o: Obj) => o.status === "received")
                .length || 0}
            </strong>
          </div>
          <div className="admin-detail-line">
            <span>Chuyển khoản chờ kiểm tra</span>
            <strong>
              {orders?.orders.filter((o: Obj) => o.payment_status === "review")
                .length || 0}
            </strong>
          </div>
          <div className="notice">
            <Truck size={17} />
            <p>
              Đơn chờ phí giao cần khách chấp nhận tổng tiền trước khi xử lý.
            </p>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Đơn hàng gần đây</h2>
          <Link className="text-link" to="/admin/orders">
            Tất cả đơn <ArrowUpRight size={15} />
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
            "Mã đơn",
            "Khách hàng",
            "Thời gian",
            "Tổng tiền",
            "Xử lý",
            "Thanh toán",
            "",
          ].map((s, i) => (
            <th key={i}>{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td data-label="Mã đơn">
              <Link to={"/admin/orders/" + o.id}>
                <strong>{o.code}</strong>
              </Link>
            </td>
            <td data-label="Khách hàng">{o.customer_name}</td>
            <td data-label="Thời gian">{date(o.created_at)}</td>
            <td data-label="Tổng tiền">
              <strong>{money(o.total)}</strong>
            </td>
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
              <Badge tone={o.payment_status === "paid" ? "lime" : ""}>
                {status[o.payment_status]}
              </Badge>
            </td>
            <td>
              <Link
                className="icon-button"
                aria-label={"Xem đơn " + o.code}
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
    <Empty title="Chưa có đơn hàng">Đơn mới sẽ xuất hiện tại đây.</Empty>
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
        title="Đơn hàng"
        description="Theo dõi, xác nhận và xử lý từng đơn hàng."
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
                  "Mã đơn",
                  "Khách hàng",
                  "SĐT",
                  "Ngày",
                  "Tổng",
                  "Xử lý",
                  "Thanh toán",
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
          <Download size={15} /> Xuất CSV
        </Button>
      </Heading>
      <ErrorBox>{error || expError}</ErrorBox>
      <section className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              value={filters.q}
              placeholder="Mã đơn, tên, điện thoại…"
              aria-label="Tìm đơn hàng"
              onChange={(e) => change("q", e.target.value)}
            />
          </div>
          <select
            aria-label="Lọc xử lý"
            value={filters.status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="">Tất cả xử lý</option>
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
            aria-label="Lọc thanh toán"
            value={filters.payment_status}
            onChange={(e) => change("payment_status", e.target.value)}
          >
            <option value="">Tất cả thanh toán</option>
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
            aria-label="Từ ngày"
            onChange={(e) => change("from", e.target.value)}
          />
          <input
            type="date"
            value={filters.to}
            aria-label="Đến ngày"
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
                {data.total} đơn · Trang {data.page}/
                {Math.max(1, Math.ceil(data.total / 20))}
              </span>
              <div>
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => change("page", filters.page - 1)}
                >
                  <ChevronLeft size={14} /> Trước
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
      setToast("Đã cập nhật đơn hàng");
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
              ? { reason: "Khách yêu cầu" }
              : {}),
    });
  };
  const actions: Obj = {
    confirm: "Xác nhận đơn",
    paid: "Xác nhận đã nhận đủ tiền",
    prepare: "Đang chuẩn bị",
    ship: "Bắt đầu giao",
    deliver: "Giao thành công",
    cancel: "Huỷ đơn",
    costs: "Chi phí thực tế",
    internal_note: "Ghi chú nội bộ",
    shipping_quote: "Báo phí giao thủ công",
    refund: "Hoàn tiền / trả hàng",
  };
  return (
    <>
      <Link className="text-link" to="/admin/orders">
        <ArrowLeft size={14} /> Danh sách đơn
      </Link>
      <Heading
        title={o.code}
        description={`Đặt lúc ${date(o.created_at)} · ${o.customer_name}`}
      >
        <Badge tone={o.status === "cancelled" ? "red" : "lime"}>
          {status[o.status]}
        </Badge>
      </Heading>
      <div className="admin-order-grid">
        <div>
          <section className="panel">
            <div className="panel-title">
              <h2>Xử lý đơn hàng</h2>
              <Badge>{status[o.payment_status]}</Badge>
            </div>
            <div className="action-grid">
              {Object.entries(actions)
                .filter(
                  ([a]) =>
                    isAdmin ||
                    !["paid", "costs", "refund", "shipping_quote"].includes(a),
                )
                .map(([a, label]: any) => (
                  <Button
                    variant={a === "cancel" ? "danger" : "outline"}
                    key={a}
                    onClick={() => open(a)}
                  >
                    {label}
                  </Button>
                ))}
            </div>
            <p className="report-note">
              Máy chủ kiểm tra bước chuyển hợp lệ. Huỷ đơn không tự hoàn tiền.
            </p>
          </section>
          <section className="panel">
            <h2>Thông tin giao hàng</h2>
            <p>
              <strong>{o.customer_name}</strong> · {o.phone}
            </p>
            <p>
              {o.address}, {o.region}
            </p>
            <p className="muted">{o.note || "Không có ghi chú từ khách."}</p>
            <div className="admin-detail-line">
              <span>Quãng đường</span>
              <strong>
                {o.distance_km ? o.distance_km + " km" : "Chưa xác định"}
              </strong>
            </div>
            <div className="admin-detail-line">
              <span>Phí giao</span>
              <strong>{money(o.shipping_fee)}</strong>
            </div>
            <div className="admin-detail-line">
              <span>Xác nhận phí</span>
              <strong>
                {o.shipping_status === "confirmed"
                  ? "Đã xác nhận"
                  : o.shipping_status === "pending"
                    ? "Chờ báo phí"
                    : "Chờ khách đồng ý"}
              </strong>
            </div>
            <div className="notice">
              <MapPinIcon />
              <p>
                {o.latitude
                  ? `${o.latitude}, ${o.longitude}`
                  : "Khách chưa ghim vị trí"}
              </p>
            </div>
          </section>
          <section className="panel">
            <h2>Ghi chú nội bộ</h2>
            <p>{o.internal_note || "Chưa có ghi chú."}</p>
            {isAdmin && (
              <>
                <div className="admin-detail-line">
                  <span>Phí giao thực trả</span>
                  <strong>{money(o.actual_shipping)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>Chi phí khác</span>
                  <strong>{money(o.other_cost)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>Tiền thực thu</span>
                  <strong>{money(o.paid_amount)}</strong>
                </div>
                <div className="admin-detail-line">
                  <span>Đã hoàn tiền</span>
                  <strong>{money(o.refunded_amount)}</strong>
                </div>
              </>
            )}
          </section>
          <section className="panel">
            <h2>Lịch sử thao tác</h2>
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
                Xác nhận thực hiện “{actions[action]}” cho đơn {o.code}?{" "}
                {action === "paid" && "Chỉ xác nhận khi đã thực nhận đủ tiền."}
              </p>
            )}
            {action === "cancel" && (
              <>
                <Field label="Lý do huỷ">
                  <select
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  >
                    {[
                      "Khách yêu cầu",
                      "Hết hàng",
                      "Không liên hệ được",
                      "Ngoài phạm vi giao",
                      "Lý do khác",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                {![
                  "Khách yêu cầu",
                  "Hết hàng",
                  "Không liên hệ được",
                  "Ngoài phạm vi giao",
                ].includes(form.reason) && (
                  <Field label="Nhập lý do">
                    <input
                      required
                      value={form.reason === "Lý do khác" ? "" : form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                    />
                  </Field>
                )}
                <p className="muted small">
                  Tồn kho được trả lại một lần. Nếu đã thu tiền, thực hiện hoàn
                  tiền riêng.
                </p>
              </>
            )}
            {action === "costs" && (
              <div className="form-grid">
                {[
                  ["actual_shipping", "Phí giao thực trả"],
                  ["other_cost", "Chi phí khác"],
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
              <Field label="Ghi chú chỉ nội bộ nhìn thấy">
                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </Field>
            )}
            {action === "shipping_quote" && (
              <>
                <Field label="Phí giao báo khách (VND)">
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
                  Khách cần mở link theo dõi và chấp nhận tổng tiền mới.
                </p>
              </>
            )}
            {action === "refund" && (
              <>
                <Field label="Giảm doanh thu phí giao (VND, nếu hoàn phí ship)">
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
                <Field label="Số tiền thực hoàn (VND)">
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
                <Field label="Dòng hàng trả (chỉ đơn đã giao)">
                  <select
                    value={form.item_id}
                    onChange={(e) =>
                      setForm({ ...form, item_id: Number(e.target.value) })
                    }
                  >
                    {o.items.map((i: Obj) => (
                      <option key={i.id} value={i.id}>
                        {i.product_name} · Đã trả {i.returned_quantity}/
                        {i.quantity}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Số lượng nhập lại kho (0 nếu chỉ hoàn tiền)">
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Lý do">
                  <textarea
                    required
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  />
                </Field>
                <p className="muted small">
                  Trả hàng điều chỉnh doanh thu và giá vốn theo snapshot. Hoàn
                  tiền chỉ điều chỉnh thực thu, không trừ doanh thu lần hai. Chỉ
                  nhập lại kho hàng thực sự nhận lại.
                </p>
              </>
            )}
            <ErrorBox>{error}</ErrorBox>
            <Button
              loading={busy}
              variant={action === "cancel" ? "danger" : "dark"}
            >
              Xác nhận thao tác
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
        title="Sản phẩm"
        description="Chăm chút danh mục, giá bán và tồn kho."
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
                  name: "Mặc định",
                  price: 0,
                  cost: 0,
                  stock: 0,
                  active: 1,
                },
              ],
            })
          }
        >
          <Plus size={16} /> Thêm sản phẩm
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              aria-label="Tìm sản phẩm quản trị"
              placeholder="Tìm tên hoặc SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="muted small">
            {data?.products.length || 0} sản phẩm
          </span>
        </div>
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                {[
                  "Sản phẩm",
                  "Danh mục",
                  "Giá bán",
                  "Giá vốn",
                  "Tồn kho",
                  "Trạng thái",
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
                    <td data-label="Sản phẩm">
                      <div className="table-product">
                        {p.images[0] && <img src={asset(p.images[0])} alt="" />}
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.variants[0]?.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Danh mục">{p.category}</td>
                    <td data-label="Giá bán">{money(p.variants[0]?.price)}</td>
                    <td data-label="Giá vốn">{money(p.variants[0]?.cost)}</td>
                    <td data-label="Tồn kho">
                      {p.variants.reduce(
                        (s: number, v: Obj) => s + Number(v.stock),
                        0,
                      )}
                    </td>
                    <td data-label="Trạng thái">
                      <Badge tone={p.active == 1 ? "lime" : ""}>
                        {p.active == 1 ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Sửa " + p.name}
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
function ProductEditor({ product, categories, onClose, onSaved }: any) {
  const [f, setF] = useState<Obj>(product),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (k: string, v: any) => setF({ ...f, [k]: v });
  const { refresh } = useStore();
  return (
    <Modal
      title={f.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("admin/products", f);
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
            ["name", "Tên sản phẩm"],
            ["slug", "Slug (a-z, số, dấu -)"],
            ["brand", "Thương hiệu"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input
                required
                value={f[k]}
                onChange={(e) => change(k, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Danh mục">
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
        <Field label="Mô tả">
          <textarea
            rows={4}
            value={f.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <div className="images-editor">
          {f.images.map((s: string, i: number) => (
            <div key={i}>
              <img src={asset(s)} alt="" />
              <button
                type="button"
                aria-label="Xoá ảnh"
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
        <Field label="Thêm ảnh JPG, PNG hoặc WebP (tối đa 5MB)">
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
            ["active", "Đang bán"],
            ["featured", "Nổi bật"],
            ["pinned", "Ghim sản phẩm"],
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
          <Field label="Thứ tự">
            <input
              type="number"
              min="0"
              value={f.sort_order}
              onChange={(e) => change("sort_order", Number(e.target.value))}
            />
          </Field>
        </div>
        <h3>Biến thể & tồn kho</h3>
        {f.variants.map((v: Obj, i: number) => (
          <div className="variant-editor" key={i}>
            <div className="form-grid">
              {[
                ["sku", "SKU", "text"],
                ["name", "Tên biến thể", "text"],
                ["price", "Giá bán (VND)", "number"],
                ["cost", "Giá vốn (VND)", "number"],
                ["stock", "Tồn kho khả dụng", "number"],
              ].map(([k, l, t]) => (
                <Field key={k} label={l}>
                  <input
                    type={t}
                    min="0"
                    required
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
                Đang bán biến thể
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
          <Plus size={14} /> Thêm biến thể
        </Button>
        <div className="form-divider">
          <h3>Flash sale (bỏ giá trống để tắt)</h3>
          <div className="form-grid">
            <Field label="Giá flash sale (VND)">
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
              ["flash_start", "Bắt đầu"],
              ["flash_end", "Kết thúc"],
            ].map(([k, l]) => (
              <Field key={k} label={l + " · giờ Việt Nam"}>
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
          Lưu sản phẩm
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
      <Heading title="Danh mục" description="Tổ chức sản phẩm để khách dễ tìm.">
        <Button
          variant="dark"
          onClick={() => setEdit({ name: "", slug: "", sort_order: 0 })}
        >
          <Plus size={16} /> Thêm danh mục
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Slug</th>
                <th>Thứ tự</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((c: Obj) => (
                <tr key={c.id}>
                  <td data-label="Tên">{c.name}</td>
                  <td data-label="Slug">{c.slug}</td>
                  <td data-label="Thứ tự">{c.sort_order}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label="Sửa danh mục"
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
          title="Danh mục"
          initial={edit}
          route="admin/categories"
          fields={[
            ["name", "Tên", "text"],
            ["slug", "Slug", "text"],
            ["sort_order", "Thứ tự", "number"],
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
        <ErrorBox>{error}</ErrorBox>
        <Button loading={busy} variant="dark full">
          Lưu
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
        title="Mã giảm giá"
        description="Điều kiện, thời gian và giới hạn sử dụng rõ ràng."
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
          <Plus size={16} /> Thêm mã
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <div className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                {[
                  "Mã",
                  "Mức giảm",
                  "Đơn tối thiểu",
                  "Lượt dùng",
                  "Hết hạn",
                  "",
                ].map((s, i) => (
                  <th key={i}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((c: Obj) => (
                <tr key={c.code}>
                  <td data-label="Mã">
                    <strong>{c.code}</strong>
                  </td>
                  <td data-label="Mức giảm">
                    {c.type === "percent" ? c.value + "%" : money(c.value)}
                  </td>
                  <td data-label="Đơn tối thiểu">{money(c.min_total)}</td>
                  <td data-label="Lượt dùng">
                    {c.uses}/{c.max_uses}
                  </td>
                  <td data-label="Hết hạn">{date(c.ends_at)}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label="Sửa mã"
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
          title="Thiết lập mã giảm giá"
          initial={edit}
          route="admin/coupons"
          fields={[
            ["code", "Mã", "text"],
            [
              "type",
              "Loại giảm",
              "select",
              [
                ["percent", "Phần trăm"],
                ["fixed", "Số tiền cố định"],
              ],
            ],
            ["value", "Giá trị", "number"],
            ["min_total", "Đơn tối thiểu (VND)", "number"],
            ["max_discount", "Giảm tối đa (VND, 0 = không giảm)", "number"],
            ["max_uses", "Lượt dùng tối đa", "number"],
            ["starts_at", "Bắt đầu · giờ Việt Nam", "datetime-local"],
            ["ends_at", "Kết thúc · giờ Việt Nam", "datetime-local"],
            ["active", "Đang kích hoạt", "checkbox"],
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
    "Doanh thu thuần",
    "Giá vốn",
    "Lãi gộp",
    "Ship thu khách",
    "Giao thực trả",
    "Chi phí khác",
    "Lãi sau chi phí",
    "Tiền thực thu ròng",
    "Công nợ",
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
        title="Báo cáo bán hàng"
        description="Doanh thu, giá vốn và lãi/lỗ từ dữ liệu đơn thực tế."
      >
        <div className="toolbar" style={{ margin: 0 }}>
          <Button
            variant="outline"
            disabled={!r}
            onClick={() =>
              csv(`Bao-cao-${from}-${to}.csv`, [
                ["Mã đơn", "Ngày đặt", "Trạng thái", ...labels],
                ...r.rows.map((o: Obj) => [
                  o.code,
                  o.created_at,
                  status[o.status],
                  ...keys.map((k) => o[k]),
                ]),
                ["TỔNG", "", "", ...keys.map((k) => r.totals[k])],
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
                setPdfError("Không tạo được PDF. Vui lòng thử lại.");
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
            Hôm nay
          </Button>
          <Button variant="outline" onClick={() => quick("week")}>
            Tuần này
          </Button>
          <Button variant="outline" onClick={() => quick("month")}>
            Tháng này
          </Button>
          <input
            type="date"
            aria-label="Báo cáo từ ngày"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            aria-label="Báo cáo đến ngày"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <select
            aria-label="Trạng thái báo cáo"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Mọi trạng thái</option>
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
          {r?.basis} Múi giờ Asia/Ho_Chi_Minh. Tiền thực thu = đã nhận − đã
          hoàn; hoàn tiền không trừ doanh thu lần hai. Trả hàng điều chỉnh doanh
          thu và giá vốn theo từng dòng hàng.
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
                    ? "Lãi gộp + ship thu − giao thực − chi phí khác"
                    : "Theo bộ lọc hiện tại"
                }
                primary={i === 0 || i === 6}
              />
            ))}
          </div>
          <section className="panel">
            <div className="panel-title">
              <h2>Bảng kê từng đơn</h2>
              <Badge>{r.rows.length} đơn</Badge>
            </div>
            <div className="table-wrap">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Trạng thái</th>
                    {labels.map((l) => (
                      <th key={l}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((o: Obj) => (
                    <tr key={o.id}>
                      <td data-label="Mã đơn">
                        <Link to={"/admin/orders/" + o.id}>
                          <strong>{o.code}</strong>
                        </Link>
                      </td>
                      <td data-label="Trạng thái">{status[o.status]}</td>
                      {keys.map((k, i) => (
                        <td key={k} data-label={labels[i]}>
                          {money(o[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td data-label="Tổng">
                      <strong>TỔNG</strong>
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
                Chưa có đơn trong khoảng ngày đã chọn.
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
  const [tab, setTab] = useState("store");
  return (
    <>
      <Heading
        title="Thiết lập cửa hàng"
        description="Thông tin, giao hàng, thanh toán và Telegram."
      />
      <div className="settings-tabs">
        {[
          ["store", "Cửa hàng"],
          ["shipping", "Vận chuyển"],
          ["payment", "Thanh toán"],
          ["telegram", "Telegram"],
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
      {data ? (
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
      ["name", "Tên cửa hàng", "text"],
      ["address", "Địa chỉ", "text"],
      ["phone", "Điện thoại", "text"],
      ["email", "Email hỗ trợ", "email"],
      ["hero_title", "Tiêu đề banner (dùng \\n để xuống dòng)", "text"],
      ["hero_subtitle", "Mô tả banner", "text"],
      ["banner", "Nội dung giới thiệu", "text"],
    ],
    shipping: [
      ["origin_lat", "Vĩ độ kho", "number"],
      ["origin_lng", "Kinh độ kho", "number"],
      ["base_fee", "Phí cơ bản (VND)", "number"],
      ["included_km", "Số km bao gồm", "number"],
      ["per_km", "Giá mỗi km thêm (VND)", "number"],
      ["max_km", "Khoảng cách tối đa (km)", "number"],
      ["free_above", "Miễn ship từ tiền hàng ròng (0 = tắt)", "number"],
      ["round_step", "Bước làm tròn (km)", "number"],
    ],
    payment: [
      ["cod", "Bật COD", "checkbox"],
      ["bank", "Bật chuyển khoản", "checkbox"],
      ["demo", "Dữ liệu ngân hàng demo", "checkbox"],
      ["bank_bin", "Mã BIN ngân hàng", "text"],
      ["bank_account", "Số tài khoản", "text"],
      ["bank_owner", "Chủ tài khoản", "text"],
      ["transfer_template", "Mẫu nội dung chuyển khoản, cần {code}", "text"],
      ["instructions", "Hướng dẫn thanh toán", "text"],
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
                store: "Thông tin & nội dung",
                shipping: "Quy tắc giao hàng",
                payment: "Phương thức thanh toán",
                telegram: "Kết nối Telegram",
              } as Obj
            )[tab]
          }
        </h2>
        {tab === "shipping" && (
          <div className="shipping-origin-editor">
            <Field label="Địa chỉ xuất phát giao hàng">
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
              Tự tính phí giao theo quãng đường xe chạy
            </label>
            <p className="report-note">
              Chọn đúng địa chỉ cửa hàng trước khi bật. Khi dịch vụ đường đi
              lỗi, đơn chờ xác nhận phí giao.
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
              <Field label="Cách làm tròn phần km thêm">
                <select
                  value={f.round_mode}
                  onChange={(e) => setF({ ...f, round_mode: e.target.value })}
                >
                  <option value="ceil">Làm tròn lên</option>
                  <option value="nearest">Làm tròn gần nhất</option>
                  <option value="exact">Không làm tròn km</option>
                </select>
              </Field>
            )}
          </div>
        ) : (
          <>
            <Badge tone={f.configured ? "lime" : ""}>
              {f.configured ? "Đã cấu hình token" : "Chưa cấu hình token"}
            </Badge>
            <p className="report-note">
              Bot token và webhook secret được mã hoá trong database, không trả
              về trình duyệt. Lưu xong bấm Đăng ký webhook bên dưới.
            </p>
            <Field label="Bot token mới (để trống giữ nguyên)">
              <input
                type="password"
                autoComplete="new-password"
                value={f.token || ""}
                onChange={(e) => setF({ ...f, token: e.target.value })}
              />
            </Field>
            <Field label="Webhook secret mới (ít nhất 32 ký tự, để trống giữ nguyên)">
              <input
                type="password"
                autoComplete="new-password"
                value={f.secret || ""}
                onChange={(e) => setF({ ...f, secret: e.target.value })}
              />
            </Field>
            <Field label="Chat ID được phép">
              <input
                value={f.chat_id}
                onChange={(e) => setF({ ...f, chat_id: e.target.value })}
              />
            </Field>
            <Field label="Telegram User ID được phép, phân cách bằng dấu phẩy">
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
              Đăng ký webhook
            </Button>
          </>
        )}
        {tab === "shipping" && (
          <div className="notice">
            <Truck size={17} />
            <p>
              Ví dụ 15.000đ / 3km đầu + 5.000đ/km → 5km = 25.000đ. Routing cần
              bật trong config.php. Không có quãng đường sẽ chờ báo phí thủ
              công.
            </p>
          </div>
        )}
        {tab === "payment" && (
          <p className="report-note">
            VietQR chỉ tạo mã thanh toán theo số tiền, không kết nối xác thực
            ngân hàng. Chuyển khoản luôn cần xác nhận thủ công.
          </p>
        )}
        <ErrorBox>{error}</ErrorBox>
        {success && <Success>Đã lưu thiết lập.</Success>}
        <Button loading={busy} variant="dark">
          Lưu thay đổi
        </Button>
      </form>
      {tab === "telegram" && (
        <section className="panel">
          <div className="panel-title">
            <h2>Hàng đợi gửi thông báo</h2>
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
              <RefreshCw size={15} /> Thử lại
            </Button>
          </div>
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>ID đơn</th>
                  <th>Trạng thái</th>
                  <th>Số lần</th>
                  <th>Lỗi</th>
                  <th>Lần tiếp</th>
                </tr>
              </thead>
              <tbody>
                {data.outbox.map((o: Obj) => (
                  <tr key={o.id}>
                    <td data-label="ID đơn">{o.order_id}</td>
                    <td data-label="Trạng thái">{o.state}</td>
                    <td data-label="Số lần">{o.attempts}</td>
                    <td data-label="Lỗi">{o.last_error || "—"}</td>
                    <td data-label="Lần tiếp">{o.next_attempt}</td>
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
        title="Nhân viên & phân quyền"
        description="Quản trị viên quản lý toàn bộ; nhân viên chỉ xử lý đơn."
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
          <Plus size={16} /> Thêm tài khoản
        </Button>
      </Heading>
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((u: Obj) => (
                <tr key={u.id}>
                  <td data-label="Họ tên">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Vai trò">
                    {u.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                  </td>
                  <td data-label="Trạng thái">
                    <Badge tone={u.active == 1 ? "lime" : ""}>
                      {u.active == 1 ? "Hoạt động" : "Đã khoá"}
                    </Badge>
                  </td>
                  <td>
                    <button
                      aria-label="Sửa tài khoản"
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
          title="Tài khoản nhân viên"
          initial={edit}
          route="admin/users"
          fields={[
            ["name", "Họ tên", "text"],
            ["email", "Email", "email"],
            [
              "password",
              "Mật khẩu (ít nhất 12 ký tự; trống giữ nguyên)",
              "password",
            ],
            [
              "role",
              "Vai trò",
              "select",
              [
                ["staff", "Nhân viên"],
                ["admin", "Quản trị viên"],
              ],
            ],
            ["active", "Đang hoạt động", "checkbox"],
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
        title="Lịch sử thao tác"
        description="Ai thay đổi gì, lúc nào và qua kênh nào."
      />
      <ErrorBox>{error}</ErrorBox>
      <section className="panel">
        {data ? (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  {[
                    "Thời gian",
                    "Người thực hiện",
                    "Kênh",
                    "Thao tác",
                    "Chi tiết",
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((a: Obj) => (
                  <tr key={a.id}>
                    <td data-label="Thời gian">{date(a.created_at)}</td>
                    <td data-label="Người thực hiện">{a.actor}</td>
                    <td data-label="Kênh">{a.channel}</td>
                    <td data-label="Thao tác">{a.action}</td>
                    <td data-label="Chi tiết" className="audit-detail">
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
