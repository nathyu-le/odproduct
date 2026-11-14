import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, CalendarDays, Zap } from "lucide-react";
import { useStore } from "./context";
import { useNow, displayProduct, saleState, timestamp } from "./promotions";
import { date, money, type Obj } from "./api";
import { Loading, Empty } from "./ui";
import { ProductCard } from "./catalogue-product";
import { SaleClock } from "./catalogue-home";
export function CatalogueFlashPage() {
  const { data } = useStore();
  const now = useNow();
  const [tab, setTab] = useState("active");
  if (!data) return <Loading />;
  const products = data.products.map((p: Obj) => displayProduct(p, now));
  const active = products.filter((p: Obj) => saleState(p, now) === "active");
  const upcoming = products
    .filter((p: Obj) => saleState(p, now) === "scheduled")
    .sort(
      (a: Obj, b: Obj) => timestamp(a.flash_start) - timestamp(b.flash_start),
    );
  const shown = tab === "active" ? active : upcoming;
  const nextEnd = active.length
    ? active.reduce((a: Obj, p: Obj) =>
        timestamp(p.flash_end) < timestamp(a.flash_end) ? p : a,
      ).flash_end
    : upcoming[0]?.flash_start;
  return (
    <div className="container page cx-flash-page">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <span>Flash sale</span>
      </div>
      <section className="cx-flash-intro">
        <div>
          <span className="cx-flash-eyebrow">
            <Zap size={16} /> ƯU ĐÃI THEO PHIÊN
          </span>
          <h1>
            Flash sale<span>.</span>
          </h1>
          <p>
            Giá ưu đãi có thời gian rõ ràng.
            <br />
            Chọn món bạn cần khi phiên đang mở.
          </p>
        </div>
        {nextEnd && (
          <SaleClock
            end={nextEnd}
            label={
              active.length
                ? "Ưu đãi gần nhất kết thúc sau"
                : "Phiên tiếp theo bắt đầu sau"
            }
          />
        )}
      </section>
      <div
        className="cx-flash-tabs"
        role="group"
        aria-label="Chọn thời gian flash sale"
      >
        <button
          aria-pressed={tab === "active"}
          onClick={() => setTab("active")}
        >
          Đang diễn ra <span>{active.length}</span>
        </button>
        <button
          aria-pressed={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
        >
          Sắp mở <span>{upcoming.length}</span>
        </button>
        <Link to="/products">
          Tất cả sản phẩm
          <ArrowRight size={16} />
        </Link>
      </div>
      {shown.length ? (
        <div className="cx-product-grid">
          {shown.map((p: Obj) => (
            <div className="cx-flash-product" key={p.id}>
              <ProductCard p={p} />
              {tab === "upcoming" && (
                <div className="cx-upcoming-date">
                  <span>
                    <CalendarDays size={15} />
                    Mở {date(p.flash_start)}
                  </span>
                  <span>
                    Giá khi mở:{" "}
                    <strong>
                      {money(Math.min(Number(p.flash_price), Number(p.price)))}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === "active"
              ? "Chưa có phiên đang diễn ra"
              : "Chưa có phiên sắp mở"
          }
        >
          {tab === "active" && upcoming.length > 0 ? (
            <button className="cx-button" onClick={() => setTab("upcoming")}>
              Xem phiên sắp mở
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link className="cx-text-link" to="/products">
              Khám phá sản phẩm
              <ArrowRight size={16} />
            </Link>
          )}
        </Empty>
      )}
    </div>
  );
}
