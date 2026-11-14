import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import { api } from "./api";
import { Button, ErrorBox } from "./ui";
export function MapsSettings() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <div className="maps-setup">
      <section className="panel">
        <div className="panel-title">
          <h2>
            <MapPin size={20} /> Bản đồ & đường giao hàng
          </h2>
          <span className="connection-pill ready">
            Miễn phí · không cần API key
          </span>
        </div>
        <p>
          Địa chỉ: Photon / OpenStreetMap. Đường xe chạy: OSRM, có máy chủ dự
          phòng. Không dùng khoảng cách đường chim bay để tính phí.
        </p>
        <div className="setup-guide">
          <ol>
            <li>
              Sang tab <b>Vận chuyển</b>, tìm và chọn đúng địa chỉ cửa hàng từ
              gợi ý.
            </li>
            <li>
              Bật <b>Tự tính phí giao theo quãng đường xe chạy</b>, nhập quy tắc
              phí rồi lưu.
            </li>
            <li>
              Khách chọn gợi ý địa chỉ hoặc ghim trên bản đồ, phí được tính
              ngay. <b>Không cần cron.</b>
            </li>
          </ol>
        </div>
        <ErrorBox>{error}</ErrorBox>
        {message && (
          <p className="maps-success">
            <CheckCircle2 size={17} />
            {message}
          </p>
        )}
        <Button
          variant="dark"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const r = await api("admin/maps/test", {});
              if (r.distance_km == null) setError(r.message);
              else
                setMessage(
                  `Kết nối tốt. Tuyến thử quanh kho: ${r.distance_km} km.`,
                );
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Kiểm tra kết nối tính đường
        </Button>
        <p className="muted small">
          Dịch vụ công khai có thể gián đoạn. Nếu cả hai máy chủ đều lỗi, đơn sẽ
          chờ cửa hàng báo phí; không tự miễn ship.
        </p>
      </section>
    </div>
  );
}
