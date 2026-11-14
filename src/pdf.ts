import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { asset, date, money, type Obj, status } from "./api";
import { tx } from "./i18n";
let font = "";
async function createPDF(title: string) {
  if (!font) {
    const b = new Uint8Array(
      await (await fetch(asset("fonts/NotoSans-Regular.ttf"))).arrayBuffer(),
    );
    let s = "";
    for (let i = 0; i < b.length; i += 8192)
      s += String.fromCharCode(...b.subarray(i, i + 8192));
    font = btoa(s);
  }
  const doc = new jsPDF();
  doc.addFileToVFS("Noto.ttf", font);
  doc.addFont("Noto.ttf", "Noto", "normal");
  doc.setFont("Noto");
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  return doc;
}
export async function receiptPDF(o: Obj) {
  const d = await createPDF(tx("Phiếu bán hàng"));
  d.setFontSize(10);
  d.text(
    [
      o.store_snapshot.name,
      o.store_snapshot.address,
      `${o.code} · ${date(o.created_at)}`,
      `${o.customer_name} · ${o.phone}`,
      `${o.address}, ${o.region}`,
    ],
    14,
    32,
    { maxWidth: 182 },
  );
  autoTable(d, {
    startY: 65,
    head: [[tx("Sản phẩm"), "SL", tx("Đơn giá"), tx("Thành tiền")]],
    body: o.items.map((i: Obj) => [
      `${i.product_name}\n${i.variant_name}`,
      i.quantity,
      money(i.unit_price),
      money(i.unit_price * i.quantity),
    ]),
    styles: { font: "Noto", fontStyle: "normal", fontSize: 9 },
    headStyles: { fillColor: [38, 42, 37], fontStyle: "normal" },
  });
  let y = (d as any).lastAutoTable.finalY + 12;
  const lines = [
    tx("Tiền hàng: {0}", [money(o.subtotal)]),
    tx("Giảm giá: {0}", [money(o.discount)]),
    tx("Phí giao: {0}", [money(o.shipping_fee)]),
    tx("Tổng thanh toán: {0}", [money(o.total)]),
    tx("Thanh toán: {0}", [status[o.payment_status]]),
    tx("Phương thức: {0}", [
      o.payment_method === "cod" ? "COD" : "Chuyển khoản",
    ]),
    tx("Phiếu bán hàng — không phải hoá đơn điện tử."),
  ];
  if (y + lines.length * 7 > 280) {
    d.addPage();
    y = 20;
  }
  d.text(lines, 14, y);
  d.save(`Phieu-ban-hang-${o.code}.pdf`);
}
export async function reportPDF(r: Obj) {
  const d = await createPDF(tx("Báo cáo bán hàng"));
  d.setFontSize(9);
  d.text(tx("{0} → {1} · Múi giờ Việt Nam", [r.from, r.to]), 14, 31);
  autoTable(d, {
    startY: 38,
    head: [
      [
        tx("Đơn"),
        "Doanh thu",
        tx("Giá vốn"),
        "Ship thu",
        tx("Giao thực"),
        tx("Khác"),
        tx("Lãi/lỗ"),
      ],
    ],
    body: [
      ...r.rows.map((o: Obj) => [
        o.code,
        ...[
          "revenue",
          "cost",
          "shipping_collected",
          "actual_shipping",
          "other_cost",
          "profit",
        ].map((k) => money(o[k])),
      ]),
      [
        tx("TỔNG"),
        ...[
          "revenue",
          "cost",
          "shipping_collected",
          "actual_shipping",
          "other_cost",
          "profit",
        ].map((k) => money(r.totals[k])),
      ],
    ],
    styles: { font: "Noto", fontStyle: "normal", fontSize: 7 },
    headStyles: { fillColor: [38, 42, 37], fontStyle: "normal" },
  });
  d.save(`Bao-cao-${r.from}-${r.to}.pdf`);
}
