import { useEffect, useRef, useState } from "react";
import type { Obj } from "./api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export function FreeMapPicker({
  lat,
  lng,
  origin,
  onChange,
}: {
  lat: any;
  lng: any;
  origin?: Obj;
  onChange: (lat: number, lng: number) => void;
}) {
  const node = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    marker = useRef<L.Marker | null>(null),
    cb = useRef(onChange);
  cb.current = onChange;
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!node.current) return;
    const m = L.map(node.current, { scrollWheelZoom: false }).setView(
      [
        Number(origin?.origin_lat || 16.0544),
        Number(origin?.origin_lng || 108.2022),
      ],
      13,
    );
    map.current = m;
    let errors = 0,
      fallback = false;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>',
        maxZoom: 19,
        referrerPolicy: "strict-origin-when-cross-origin",
      },
    ).addTo(m);
    tiles.on("tileerror", () => {
      errors++;
      if (errors >= 3 && !fallback) {
        fallback = true;
        m.attributionControl.addAttribution(
          '<a href="https://carto.com/attributions" target="_blank" rel="noreferrer">© CARTO</a>',
        );
        tiles.setUrl(
          "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        );
      } else if (errors >= 7) setTileError(true);
    });
    tiles.on("tileload", () => setTileError(false));
    m.on("click", (e: L.LeafletMouseEvent) =>
      cb.current(e.latlng.lat, e.latlng.lng),
    );
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(node.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (map.current && lat !== "" && lng !== "") {
      marker.current?.remove();
      marker.current = L.marker([Number(lat), Number(lng)], {
        draggable: true,
        icon: L.divIcon({
          className: "delivery-pin",
          html: "<span></span>",
          iconSize: [28, 36],
          iconAnchor: [14, 32],
        }),
      }).addTo(map.current);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        cb.current(p.lat, p.lng);
      });
      map.current.setView([Number(lat), Number(lng)], 16, {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } else {
      marker.current?.remove();
      marker.current = null;
    }
  }, [lat, lng]);
  return (
    <div className="map-wrapper">
      <div
        className="map street-map"
        ref={node}
        aria-label="Bản đồ nhận hàng, chạm để đổi điểm giao"
      />
      {tileError && (
        <div className="map-unavailable">
          Chưa tải được nền bản đồ. Bạn vẫn có thể chọn địa chỉ từ gợi ý phía
          trên.
        </div>
      )}
    </div>
  );
}
