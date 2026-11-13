import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asset, money, date, type Obj, status } from './api';
let font = '';
async function createPDF(title: string) {
  if (!font) {
    const b = new Uint8Array(
      await (await fetch(asset('fonts/NotoSans-Regular.ttf'))).arrayBuffer(),
    );
    let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
    font = btoa(s);
  }
  const doc = new jsPDF();
  doc.addFileToVFS('Noto.ttf', font);
  doc.addFont('Noto.ttf', 'Noto', 'normal');
  doc.setFont('Noto');
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  return doc;
}
export async function receiptPDF(o: Obj) {
  const d = await createPDF('Phiếu bán hàng');
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
    head: [['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']],
    body: o.items.map((i: Obj) => [
      `${i.product_name}\n${i.variant_name}`,
      i.quantity,
      money(i.unit_price),
      money(i.unit_price * i.quantity),
    ]),
    styles: { font: 'Noto', fontStyle: 'normal', fontSize: 9 },
    headStyles: { fillColor: [38, 42, 37], fontStyle: 'normal' },
  });
  let y = (d as any).lastAutoTable.finalY + 12;
  const lines = [
    `Tiền hàng: ${money(o.subtotal)}`,
    `Giảm giá: ${money(o.discount)}`,
    `Phí giao: ${money(o.shipping_fee)}`,
    `Tổng thanh toán: ${money(o.total)}`,
    `Thanh toán: ${status[o.payment_status]}`,
    `Phương thức: ${o.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}`,
    'Phiếu bán hàng — không phải hoá đơn điện tử.',
  ];
  if (y + lines.length * 7 > 280) {
    d.addPage();
    y = 20;
  }
  d.text(lines, 14, y);
  d.save(`Phieu-ban-hang-${o.code}.pdf`);
}
export async function reportPDF(r: Obj) {
  const d = await createPDF('Báo cáo bán hàng');
  d.setFontSize(9);
  d.text(`${r.from} → ${r.to} · Múi giờ Việt Nam`, 14, 31);
  autoTable(d, {
    startY: 38,
    head: [['Đơn', 'Doanh thu', 'Giá vốn', 'Ship thu', 'Giao thực', 'Khác', 'Lãi/lỗ']],
    body: [
      ...r.rows.map((o: Obj) => [
        o.code,
        ...['revenue', 'cost', 'shipping_collected', 'actual_shipping', 'other_cost', 'profit'].map(
          (k) => money(o[k]),
        ),
      ]),
      [
        'TỔNG',
        ...['revenue', 'cost', 'shipping_collected', 'actual_shipping', 'other_cost', 'profit'].map(
          (k) => money(r.totals[k]),
        ),
      ],
    ],
    styles: { font: 'Noto', fontStyle: 'normal', fontSize: 7 },
    headStyles: { fillColor: [38, 42, 37], fontStyle: 'normal' },
  });
  d.save(`Bao-cao-${r.from}-${r.to}.pdf`);
}
