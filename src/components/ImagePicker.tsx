import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { asset, upload } from "../api";
import { tx } from "../i18n";
export function ImagePicker({
  value,
  onChange,
  label,
  optional = false,
  onBusy,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  optional?: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="image-picker">
      <span className="field-label">{label}</span>
      {value && (
        <div className="image-picker-preview">
          <img src={asset(value)} alt={tx("Xem trước ảnh")} />
        </div>
      )}
      <div className="image-picker-actions">
        <label className={"button outline " + (busy ? "disabled" : "")}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              onBusy?.(true);
              setError("");
              try {
                if (f.size > 5 * 1024 * 1024)
                  throw Error(tx("Ảnh tối đa 5MB."));
                onChange(await upload(f));
              } catch (err: any) {
                setError(err.message);
              } finally {
                setBusy(false);
                onBusy?.(false);
                e.target.value = "";
              }
            }}
          />
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          <span>
            {busy
              ? tx("Đang tải ảnh…")
              : value
                ? tx("Đổi ảnh")
                : tx("Tải ảnh lên")}
          </span>
        </label>
        {value && optional && (
          <button
            type="button"
            className="button outline"
            onClick={() => onChange("")}
            disabled={busy}
          >
            <Trash2 size={15} />
            {tx("Xoá ảnh")}
          </button>
        )}
      </div>
      <small>{tx("JPG, PNG, WebP · ≤ 5 MB · tối đa 6000px")}</small>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
