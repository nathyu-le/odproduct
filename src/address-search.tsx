import { useEffect, useId, useState } from "react";
import { Search, MapPin, Loader2, Check } from "lucide-react";
import { api, type Obj } from "./api";
export function AddressSearch({
  value,
  region,
  selected,
  onChange,
  onSelect,
}: {
  value: string;
  region: string;
  selected: boolean;
  onChange: (v: string) => void;
  onSelect: (v: Obj) => void;
}) {
  const id = useId();
  const [results, setResults] = useState<Obj[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [index, setIndex] = useState(0),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setResults([]);
    setError("");
    if (selected || value.trim().length < 4) {
      setBusy(false);
      return;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const query = [value.trim(), region.trim()].filter(Boolean).join(", ");
        const r = await api("geocoding/search", { query });
        if (active) {
          setResults(r.results);
          setOpen(true);
          setIndex(0);
          if (!r.results.length)
            setError(
              "Chưa có gợi ý. Thêm tên phường/xã hoặc thành phố để tìm chính xác hơn.",
            );
        }
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setBusy(false);
      }
    }, 650);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, region, selected, attempt]);
  function choose(result: Obj) {
    onSelect(result);
    setOpen(false);
    setResults([]);
  }
  return (
    <div className="address-autocomplete">
      <div className={`address-input ${selected ? "located" : ""}`}>
        <MapPin size={18} />
        <input
          role="combobox"
          aria-label="Địa chỉ nhận hàng, có gợi ý bản đồ"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={id}
          aria-activedescendant={
            open && results[index] ? id + "-" + index : undefined
          }
          autoComplete="off"
          required
          maxLength={300}
          placeholder="Nhập số nhà, đường, phường/xã, thành phố…"
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((n) => Math.min(results.length - 1, n + 1));
              setOpen(true);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((n) => Math.max(0, n - 1));
            }
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") {
              e.preventDefault();
              if (open && results[index]) choose(results[index]);
              else setAttempt((n) => n + 1);
            }
          }}
        />
        {busy ? (
          <Loader2 size={17} className="spin" />
        ) : selected ? (
          <Check size={17} />
        ) : (
          <Search size={17} />
        )}
      </div>
      {open && results.length > 0 && (
        <div
          className="address-results"
          role="listbox"
          id={id}
          aria-label="Địa chỉ gợi ý"
        >
          {results.map((r, i) => (
            <button
              type="button"
              role="option"
              aria-selected={index === i}
              id={id + "-" + i}
              className={index === i ? "highlighted" : ""}
              key={r.id + "-" + i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
            >
              <MapPin size={17} />
              <span>
                <strong>{r.address}</strong>
                <small>{r.region || r.label}</small>
              </span>
              {index === i && <ArrowHint />}
            </button>
          ))}
          <small className="geocoder-credit">
            Địa chỉ © OpenStreetMap / Photon
          </small>
        </div>
      )}
      {selected ? (
        <small className="address-confirmed">
          <Check size={12} /> Đã ghim vị trí nhận hàng. Phí giao đang được cập
          nhật theo điểm này.
        </small>
      ) : (
        <small className={error ? "address-hint error" : "address-hint"}>
          {busy
            ? "Đang tìm địa chỉ trên bản đồ…"
            : error ||
              "Gõ địa chỉ rồi chọn một gợi ý để tự ghim vị trí và tính phí giao."}
        </small>
      )}
    </div>
  );
}
function ArrowHint() {
  return <span className="address-return">↵</span>;
}
