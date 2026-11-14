import { syncServerClock } from "./promotions";
export type Obj = Record<string, any>;
let csrf = "";
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
async function requestApi(
  route: string,
  body?: Obj,
  extra: Record<string, string> = {},
) {
  const [path, queryString = ""] = route.split("?");
  const res = await fetch(
    `${import.meta.env.BASE_URL}api/index.php?route=${encodeURIComponent(path)}${queryString ? "&" + queryString : ""}`,
    {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body
        ? { "Content-Type": "application/json", "X-CSRF-Token": csrf, ...extra }
        : {},
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const data = await res
    .json()
    .catch(() => ({ error: "Máy chủ trả dữ liệu không hợp lệ." }));
  if (data?.installation_required) {
    location.replace(
      new URL(`${import.meta.env.BASE_URL}api/install.php`, document.baseURI)
        .href,
    );
    throw new Error("Mở trang cài đặt cửa hàng…");
  }
  if (!res.ok) throw new Error(data.error || "Không kết nối được máy chủ.");
  if (data?.csrf) csrf = data.csrf;
  if (data?.server_time) syncServerClock(data.server_time);
  return data;
}
let sessionRequest: Promise<any> | null = null;
export async function api(
  route: string,
  body?: Obj,
  extra: Record<string, string> = {},
) {
  if (route === "session" && !body) {
    if (!sessionRequest)
      sessionRequest = requestApi(route).finally(() => {
        sessionRequest = null;
      });
    return sessionRequest;
  }
  if (body && !csrf) await api("session");
  return requestApi(route, body, extra);
}
export async function upload(file: File) {
  if (!csrf) await api("session");
  const form = new FormData();
  form.append("image", file);
  const r = await fetch(
    `${import.meta.env.BASE_URL}api/index.php?route=admin/upload`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrf },
      body: form,
    },
  );
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d.path;
}
export const money = (n: any) =>
  n == null
    ? "Chờ xác nhận"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(n));
export const date = (d: string) =>
  new Date(d.replace(" ", "T") + "+07:00").toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export const status: Obj = {
  received: "Đã nhận đơn",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Giao thành công",
  cancelled: "Đã huỷ",
  pending: "Chờ thanh toán",
  review: "Chờ kiểm tra",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  partial_refund: "Hoàn một phần",
  awaiting_customer: "Chờ bạn xác nhận",
};
