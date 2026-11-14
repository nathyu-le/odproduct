import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Heart,
  Plus,
  Zap,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "./context";
import { asset, money, type Obj } from "./api";
import {
  useNow,
  displayProduct,
  saleState,
  savings,
  timestamp,
} from "./promotions";
export function ProductCard({ p: source }: { p: Obj; number?: number }) {
  const { add } = useStore();
  const now = useNow();
  const p = displayProduct(source, now);
  const active = saleState(p, now) === "active";
  const percent = savings(p);
  const stock = p.variants.reduce(
    (s: number, v: Obj) => s + Number(v.stock),
    0,
  );
  const isNew =
    now >= timestamp(p.created_at) &&
    now - timestamp(p.created_at) < 14 * 86400000;
  const [liked, setLiked] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("od.favs") || "[]").includes(
          p.id,
        );
      } catch {
        return false;
      }
    }),
    [added, setAdded] = useState(false);
  useEffect(() => {
    if (added) {
      const t = setTimeout(() => setAdded(false), 1700);
      return () => clearTimeout(t);
    }
  }, [added]);
  useEffect(() => {
    const update = () => {
      try {
        setLiked(
          JSON.parse(localStorage.getItem("od.favs") || "[]").includes(p.id),
        );
      } catch {}
    };
    window.addEventListener("od.favs.changed", update);
    return () => window.removeEventListener("od.favs.changed", update);
  }, [p.id]);
  function toggle() {
    try {
      const f = JSON.parse(localStorage.getItem("od.favs") || "[]");
      localStorage.setItem(
        "od.favs",
        JSON.stringify(
          liked ? f.filter((id: number) => id !== p.id) : [...f, p.id],
        ),
      );
      setLiked(!liked);
      window.dispatchEvent(new Event("od.favs.changed"));
    } catch {}
  }
  function quickAdd() {
    if (!stock) return;
    if (p.variants.length > 1) {
      location.hash = "/product/" + p.slug;
      return;
    }
    add(Number(p.variants[0].id));
    setAdded(true);
  }
  return (
    <article
      className={
        "product-card cx-product" +
        (active ? " on-sale" : "") +
        (added ? " just-added" : "")
      }
    >
      <div className="cx-product-media">
        <Link to={"/product/" + p.slug} aria-label={"Xem " + p.name}>
          {p.images[0] ? (
            <img src={asset(p.images[0])} alt={p.name} loading="lazy" />
          ) : (
            <span className="cx-no-photo">
              <ImageIcon size={32} />
              <span>Chưa có ảnh</span>
            </span>
          )}
        </Link>
        {!stock ? (
          <span className="cx-product-tag is-muted">Hết hàng</span>
        ) : active && percent > 0 ? (
          <span className="cx-product-tag is-sale">
            <Zap size={12} />−{percent}%
          </span>
        ) : isNew ? (
          <span className="cx-product-tag">Mới về</span>
        ) : Number(p.pinned) ? (
          <span className="cx-product-tag">Được chọn</span>
        ) : null}
        <button
          className={"cx-favorite" + (liked ? " selected" : "")}
          onClick={toggle}
          aria-label={(liked ? "Bỏ yêu thích " : "Yêu thích ") + p.name}
          aria-pressed={liked}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="cx-product-info">
        <div className="cx-product-meta">
          <span>{p.brand}</span>
          {stock > 0 && stock <= 5 && (
            <span className="cx-low-stock">Còn {stock}</span>
          )}
        </div>
        <Link to={"/product/" + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <p>{p.variants[0]?.name || "Chưa có mẫu đang bán"}</p>
        <p className="cx-product-excerpt">{p.description}</p>
        <div className="cx-product-bottom">
          <div>
            <strong>{money(p.price)}</strong>
            {active && percent > 0 && (
              <del>{money(p.variants[0]?.compare_price)}</del>
            )}
          </div>
          <button
            className={"cx-add" + (added ? " added" : "")}
            disabled={!stock}
            onClick={quickAdd}
            aria-label={
              (p.variants.length > 1 ? "Chọn mẫu " : "Thêm vào giỏ ") + p.name
            }
          >
            {added ? (
              <Check size={20} />
            ) : p.variants.length > 1 ? (
              <ArrowUpRight size={20} />
            ) : (
              <Plus size={20} />
            )}
          </button>
        </div>
        {active && stock > 0 && (
          <span className="cx-sale-caption">
            <Zap size={12} />
            Giá flash sale
          </span>
        )}
        {!(active && stock > 0) && (
          <span className="cx-card-note" aria-hidden="true">
            &nbsp;
          </span>
        )}
      </div>
    </article>
  );
}
