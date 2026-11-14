import { ArrowRight, CalendarDays, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { date, money, type Obj } from "./api";
import { SaleClock } from "./catalogue-home";
import { ProductCard } from "./catalogue-product";
import { useStore } from "./context";
import { tx } from "./i18n";
import { displayProduct, saleState, timestamp, useNow } from "./promotions";
import { Empty, Loading } from "./ui";
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
        <Link to="/">{tx("Trang chủ")}</Link>
        <ChevronRight size={14} />
        <span>{tx("Flash sale")}</span>
      </div>
      <section className="cx-flash-intro">
        <div>
          <span className="cx-flash-eyebrow">
            <Zap size={16} />
            {tx(" ƯU ĐÃI THEO PHIÊN")}
          </span>
          <h1>
            {tx("Flash sale")}
            <span>.</span>
          </h1>
          <p>
            {tx("Giá ưu đãi có thời gian rõ ràng.")}
            <br />
            {tx("Chọn món bạn cần khi phiên đang mở.")}
          </p>
        </div>
        {nextEnd && (
          <SaleClock
            end={nextEnd}
            label={
              active.length
                ? tx("Ưu đãi gần nhất kết thúc sau")
                : tx("Phiên tiếp theo bắt đầu sau")
            }
          />
        )}
      </section>
      <div
        className="cx-flash-tabs"
        role="group"
        aria-label={tx("Chọn thời gian flash sale")}
      >
        <button
          aria-pressed={tab === "active"}
          onClick={() => setTab("active")}
        >
          {tx("Đang diễn ra ")}
          <span>{active.length}</span>
        </button>
        <button
          aria-pressed={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
        >
          {tx("Sắp mở ")}
          <span>{upcoming.length}</span>
        </button>
        <Link to="/products">
          {tx("Tất cả sản phẩm")}
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
                    {tx("Mở ")}
                    {date(p.flash_start)}
                  </span>
                  <span>
                    {tx("Giá khi mở:")}{" "}
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
              ? tx("Chưa có phiên đang diễn ra")
              : tx("Chưa có phiên sắp mở")
          }
        >
          {tab === "active" && upcoming.length > 0 ? (
            <button className="cx-button" onClick={() => setTab("upcoming")}>
              {tx("Xem phiên sắp mở")}
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link className="cx-text-link" to="/products">
              {tx("Khám phá sản phẩm")}
              <ArrowRight size={16} />
            </Link>
          )}
        </Empty>
      )}
    </div>
  );
}
