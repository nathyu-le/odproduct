import { Check, ChevronRight, Info, Truck, Wallet } from "lucide-react";
import { money, status, type Obj } from "./api";
import { tx } from "./i18n";
import { Badge, Button } from "./ui";
const steps = [
  ["received", tx("Đã nhận đơn")],
  ["confirmed", tx("Xác nhận")],
  ["preparing", tx("Chuẩn bị")],
  ["shipping", tx("Đang giao")],
  ["delivered", tx("Hoàn tất")],
];
export function OrderWorkflow({
  o,
  isAdmin,
  open,
}: {
  o: Obj;
  isAdmin: boolean;
  open: (action: string) => void;
}) {
  const current = steps.findIndex(([key]) => key === o.status);
  const next: Obj = {
    received: [
      "confirm",
      tx("Xác nhận đơn"),
      tx("Kiểm tra sản phẩm và địa chỉ trước khi nhận xử lý."),
    ],
    confirmed: [
      "prepare",
      tx("Chuẩn bị hàng"),
      tx("Lấy đủ sản phẩm, kiểm tra và đóng gói."),
    ],
    preparing: [
      "ship",
      tx("Bắt đầu giao"),
      tx("Bàn giao hàng cho người giao rồi chuyển sang bước này."),
    ],
    shipping: [
      "deliver",
      tx("Xác nhận giao thành công"),
      tx("Chỉ bấm khi khách đã nhận được hàng."),
    ],
  };
  const action = next[o.status];
  const shippingPending = o.shipping_status !== "confirmed";
  const bankPending =
    o.payment_method === "bank" && o.payment_status !== "paid";
  const canPay =
    isAdmin &&
    o.status !== "cancelled" &&
    o.payment_status !== "paid" &&
    Number(o.refunded_amount) === 0 &&
    o.total != null &&
    !shippingPending;
  const canCancel = ["received", "confirmed", "preparing"].includes(o.status);
  return (
    <section className="panel order-workflow">
      <div className="panel-title">
        <h2>{tx("Quy trình xử lý")}</h2>
        <Badge>{status[o.payment_status]}</Badge>
      </div>
      <ol className="order-steps">
        {steps.map(([key, label], i) => (
          <li
            className={
              o.status === "cancelled"
                ? "cancelled"
                : i < current
                  ? "done"
                  : i === current
                    ? "current"
                    : ""
            }
            key={key}
          >
            <span>
              {i < current ? (
                <Check size={15} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <b>{label}</b>
          </li>
        ))}
      </ol>
      {o.status === "cancelled" ? (
        <div className="workflow-next">
          <strong>{tx("Đơn đã huỷ")}</strong>
          <p>
            {o.cancel_reason ||
              tx(
                "Không tiếp tục giao hàng. Nếu đã thu tiền, thực hiện hoàn tiền bên dưới.",
              )}
          </p>
        </div>
      ) : shippingPending ? (
        <div className="workflow-next amber">
          <Truck size={22} />
          <div>
            <strong>
              {o.shipping_status === "awaiting_customer"
                ? tx("Chờ khách đồng ý phí giao")
                : tx("Cần báo phí giao trước")}
            </strong>
            <p>
              {o.shipping_status === "awaiting_customer"
                ? tx(
                    "Gửi khách liên kết đơn để họ xác nhận tổng. Sau đó nút bước tiếp theo sẽ mở.",
                  )
                : tx(
                    "Phí chưa xác định. Báo phí thủ công, sau đó chờ khách xác nhận.",
                  )}
            </p>
          </div>
          {isAdmin && o.shipping_status === "pending" && (
            <Button variant="dark" onClick={() => open("shipping_quote")}>
              {tx("Báo phí giao")}
            </Button>
          )}
        </div>
      ) : bankPending ? (
        <div className="workflow-next amber">
          <Wallet size={22} />
          <div>
            <strong>{tx("Kiểm tra tiền chuyển khoản")}</strong>
            <p>
              {tx("Đối chiếu tài khoản ngân hàng. Chỉ xác nhận khi đã nhận đủ")}{" "}
              {money(o.total)}.
            </p>
          </div>
          {canPay && (
            <Button variant="dark" onClick={() => open("paid")}>
              {tx("Đã nhận đủ tiền")}
            </Button>
          )}
        </div>
      ) : action ? (
        <div className="workflow-next">
          <div>
            <small>{tx("BƯỚC TIẾP THEO")}</small>
            <strong>{action[1]}</strong>
            <p>{action[2]}</p>
          </div>
          <Button variant="dark" onClick={() => open(action[0])}>
            {action[1]} <ChevronRight size={16} />
          </Button>
        </div>
      ) : (
        <div className="workflow-next">
          <Check size={22} />
          <div>
            <strong>{tx("Đã giao xong")}</strong>
            <p>
              {o.payment_status === "paid"
                ? tx("Đơn và thanh toán đã hoàn tất.")
                : tx("Còn chờ ghi nhận tiền COD bên dưới.")}
            </p>
          </div>
        </div>
      )}
      <div className="workflow-payment">
        <span>
          <Wallet size={17} />{" "}
          {o.payment_method === "cod"
            ? tx("Tiền mặt / COD")
            : tx("Chuyển khoản")}{" "}
          · {status[o.payment_status]}
        </span>
        {canPay && !bankPending && (
          <Button variant="outline" onClick={() => open("paid")}>
            {tx("Ghi nhận đã thu đủ tiền")}
          </Button>
        )}
      </div>
      <details className="workflow-other">
        <summary>{tx("Thao tác bổ sung")}</summary>
        <div className="workflow-tools">
          <Button variant="outline" onClick={() => open("internal_note")}>
            {tx("Ghi chú nội bộ")}
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => open("costs")}>
              {tx("Nhập chi phí thực tế")}
            </Button>
          )}
          {isAdmin &&
            (Number(o.paid_amount) > Number(o.refunded_amount) ||
              o.status === "delivered") && (
              <Button variant="outline" onClick={() => open("refund")}>
                {tx("Hoàn tiền / trả hàng")}
              </Button>
            )}
          {canCancel && (
            <Button variant="danger" onClick={() => open("cancel")}>
              {tx("Huỷ đơn")}
            </Button>
          )}
        </div>
        <p>
          <Info size={14} />
          {tx(
            " Huỷ đơn và hoàn tiền là hai thao tác riêng. Đơn đang giao không thể huỷ; cần xử lý trả hàng.",
          )}
        </p>
      </details>
    </section>
  );
}
