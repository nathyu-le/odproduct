import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Plus,
  Search,
  Pencil,
  ArrowUpRight,
  Clock,
  CalendarDays,
  Check,
  Pause,
  RefreshCw,
} from "lucide-react";
import { api, asset, money, date, type Obj } from "./api";
import { useStore } from "./context";
import { useNow, saleState, timestamp } from "./promotions";
import { Button, Badge, Field, Modal, ErrorBox, Loading, Empty } from "./ui";
const names: Obj = {
  active: "Đang diễn ra",
  scheduled: "Sắp diễn ra",
  ended: "Đã kết thúc",
  off: "Chưa lên lịch",
};
const pad = (n: number) => String(n).padStart(2, "0");
function localTime(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  })
    .format(date)
    .replace(" ", "T");
}
export function AdminFlashSales() {
  const { refresh, setToast } = useStore();
  const now = useNow();
  const [products, setProducts] = useState<Obj[] | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("all"),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState<Obj | null>(null);
  const load = () =>
    api("admin/products")
      .then((d) => {
        setProducts(d.products);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const counts = { active: 0, scheduled: 0, ended: 0, off: 0 };
  for (const p of products || []) counts[saleState(p, now)]++;
  const filtered = (products || []).filter(
    (p) =>
      (tab === "all" || saleState(p, now) === tab) &&
      `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="flash-admin">
      <div className="dash-heading">
        <div>
          <span className="admin-overline">ƯU ĐÃI / THỜI GIAN & GIÁ BÁN</span>
          <h1>
            Flash sale<span>.</span>
          </h1>
          <p>Lên lịch theo giờ Việt Nam. Giá tự áp dụng khi phiên bắt đầu.</p>
        </div>
        <Button variant="dark" onClick={() => setEditing({ new: true })}>
          <Plus size={16} /> Lên lịch ưu đãi
        </Button>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <div className="flash-admin-stats">
        {[
          ["active", "Đang mở", Zap],
          ["scheduled", "Sắp diễn ra", CalendarDays],
          ["ended", "Đã kết thúc", Clock],
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "active" : ""}
          >
            <span>
              <Icon size={16} />
              {label}
            </span>
            <strong>{counts[key as keyof typeof counts]}</strong>
            <small>Nhấn để xem sản phẩm</small>
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm sản phẩm ưu đãi…"
              aria-label="Tìm Flash sale"
            />
          </div>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            aria-label="Lọc trạng thái Flash sale"
          >
            <option value="all">Tất cả sản phẩm</option>
            {Object.entries(names).map(([k, l]) => (
              <option key={k} value={k}>
                {l as string}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={load}>
            <RefreshCw size={15} />
          </Button>
          <Link className="text-link" to="/flash-sale">
            Xem trang khách <ArrowUpRight size={15} />
          </Link>
        </div>
        {!products ? (
          <Loading />
        ) : filtered.length ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá thường</th>
                <th>Giá Flash sale</th>
                <th>Thời gian (VN)</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const state = saleState(p, now);
                return (
                  <tr key={p.id}>
                    <td data-label="Sản phẩm">
                      <div className="table-product">
                        <img src={asset(p.images[0])} alt="" />
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            {p.brand} ·{" "}
                            {p.variants.reduce(
                              (s: number, v: Obj) => s + Number(v.stock),
                              0,
                            )}{" "}
                            sản phẩm trong kho
                          </small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Giá thường">
                      {money(p.variants[0]?.price)}
                    </td>
                    <td data-label="Giá ưu đãi">
                      <strong>
                        {p.flash_price == null ? "—" : money(p.flash_price)}
                      </strong>
                    </td>
                    <td data-label="Thời gian">
                      <div className="sale-period">
                        {p.flash_start ? (
                          <>
                            <span>{date(p.flash_start)}</span>
                            <small>đến {date(p.flash_end)}</small>
                          </>
                        ) : (
                          "Chưa lên lịch"
                        )}
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      <Badge
                        tone={
                          state === "active"
                            ? "lime"
                            : state === "ended"
                              ? "red"
                              : ""
                        }
                      >
                        {state === "active" && <Zap size={10} />} {names[state]}
                      </Badge>
                      {!Number(p.active) && (
                        <small className="muted"> · Sản phẩm ngừng bán</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Cấu hình Flash sale " + p.name}
                        onClick={() => setEditing(p)}
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty title="Không có sản phẩm phù hợp">
            Đổi bộ lọc hoặc thêm sản phẩm trước.
          </Empty>
        )}
        <div className="notice">
          <Clock size={17} />
          <div>
            <strong>Không cần bật/tắt thủ công theo giờ</strong>
            <p>
              Hết thời gian, sản phẩm tự trở lại giá thường. Flash sale dùng tồn
              kho thật; coupon vẫn theo điều kiện đã cấu hình.
            </p>
          </div>
        </div>
      </div>
      {editing && products && (
        <FlashEditor
          product={editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
            refresh();
            setToast("Đã lưu lịch Flash sale");
          }}
        />
      )}
    </div>
  );
}
function FlashEditor({ product, products, onClose, onSaved }: any) {
  const initial = product.new
    ? products.find((p: Obj) => Number(p.active))
    : product;
  const [id, setId] = useState(initial?.id || ""),
    [enabled, setEnabled] = useState(true),
    [price, setPrice] = useState(initial?.flash_price ?? ""),
    [start, setStart] = useState(
      initial?.flash_start?.replace(" ", "T").slice(0, 16) ||
        localTime(new Date()),
    ),
    [end, setEnd] = useState(
      initial?.flash_end?.replace(" ", "T").slice(0, 16) ||
        localTime(new Date(Date.now() + 86400000)),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const selected = products.find((p: Obj) => String(p.id) === String(id));
  const base = Math.min(
    ...(selected?.variants || [])
      .filter((v: Obj) => Number(v.active))
      .map((v: Obj) => Number(v.price)),
  );
  const percent =
    Number(price) > 0 && base > Number(price)
      ? Math.round(((base - Number(price)) / base) * 100)
      : 0;
  return (
    <Modal title="Cấu hình Flash sale" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("admin/flash-sales", {
              id: Number(id),
              enabled,
              flash_price: price,
              flash_start: start.replace("T", " "),
              flash_end: end.replace("T", " "),
            });
            onSaved();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Sản phẩm">
          <select
            value={id}
            required
            onChange={(e) => {
              setId(e.target.value);
              const p = products.find(
                (p: Obj) => String(p.id) === e.target.value,
              );
              setPrice(p?.flash_price ?? "");
            }}
          >
            {products.map((p: Obj) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {!Number(p.active) ? " (ngừng bán)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{" "}
          Bật lịch Flash sale
        </label>
        {enabled ? (
          <>
            <div className="flash-price-preview">
              <span>
                Giá thường từ{" "}
                <strong>
                  {Number.isFinite(base) ? money(base) : "Chưa có biến thể"}
                </strong>
              </span>
              {percent > 0 && <Badge tone="lime">Giảm {percent}%</Badge>}
            </div>
            <Field label="Giá Flash sale (VND)">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Bắt đầu · giờ Việt Nam">
                <input
                  type="datetime-local"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="Kết thúc · giờ Việt Nam">
                <input
                  type="datetime-local"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>
            <p className="report-note">
              Mỗi sản phẩm có một lịch ưu đãi. Giá này áp dụng cho biến thể đang
              bán và phải thấp hơn giá thường.
            </p>
          </>
        ) : (
          <p className="report-note">
            Tắt lịch sẽ đưa sản phẩm về giá thường ngay. Giá trên các đơn đã đặt
            được giữ nguyên.
          </p>
        )}
        <ErrorBox>{error}</ErrorBox>
        <Button variant="dark full" loading={busy}>
          <Check size={16} /> Lưu Flash sale
        </Button>
      </form>
    </Modal>
  );
}
