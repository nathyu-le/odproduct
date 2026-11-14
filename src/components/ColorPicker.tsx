import { useEffect, useState } from "react";
import { tx } from "../i18n";
export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parts = (hex: string) =>
    [1, 3, 5].map((i) => String(parseInt(hex.slice(i, i + 2), 16)));
  const [hex, setHex] = useState(value),
    [rgb, setRgb] = useState(parts(value));
  useEffect(() => {
    setHex(value);
    setRgb(parts(value));
  }, [value]);
  const valid = /^#[a-f0-9]{6}$/i.test(hex);
  return (
    <fieldset className="brand-color-field">
      <legend>{label}</legend>
      <div className="brand-color-main">
        <input
          type="color"
          aria-label={tx("Mở bảng màu {0}", [label])}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label>
          <span>HEX</span>
          <input
            aria-label={label + " HEX"}
            value={hex}
            required
            pattern="#[a-fA-F0-9]{6}"
            maxLength={7}
            spellCheck={false}
            aria-invalid={!valid}
            onChange={(e) => {
              setHex(e.target.value);
              if (/^#[a-f0-9]{6}$/i.test(e.target.value))
                onChange(e.target.value.toLowerCase());
            }}
          />
        </label>
      </div>
      <div className="brand-rgb">
        {["R", "G", "B"].map((channel, i) => (
          <label key={channel}>
            <span>{channel}</span>
            <input
              type="number"
              min={0}
              max={255}
              step={1}
              required
              aria-label={label + " " + channel}
              value={rgb[i]}
              onChange={(e) => {
                const next = [...rgb];
                next[i] = e.target.value;
                setRgb(next);
                if (
                  next.every(
                    (n) =>
                      n !== "" &&
                      Number.isInteger(Number(n)) &&
                      Number(n) >= 0 &&
                      Number(n) <= 255,
                  )
                )
                  onChange(
                    "#" +
                      next
                        .map((n) => Number(n).toString(16).padStart(2, "0"))
                        .join(""),
                  );
              }}
            />
          </label>
        ))}
      </div>
      {!valid && (
        <small className="field-error">
          {tx("Mã HEX cần đủ 6 ký tự sau dấu #.")}
        </small>
      )}
    </fieldset>
  );
}
