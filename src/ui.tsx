import { AlertCircle, ArrowRight, Check, Loader2, X } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { tx } from "./i18n";
export function Button({
  children,
  loading = false,
  variant = "",
  className = "",
  ...props
}: any) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`button ${variant} ${className}`}
    >
      {loading ? <Loader2 size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Empty({ title, children, icon }: any) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon || <AlertCircle />}</div>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" />
      <span>{tx("Đang tải dữ liệu…")}</span>
    </div>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const items = Children.toArray(children);
  const helpers = items
    .map((child, i) =>
      isValidElement(child) && child.type === "small" ? id + "-help-" + i : "",
    )
    .filter(Boolean);
  if (error) helpers.push(id + "-error");
  const controls = items.map((child, i) => {
    if (!isValidElement(child)) return child;
    if (child.type === "small")
      return cloneElement(child as ReactElement<any>, {
        id: id + "-help-" + i,
      });
    if (
      typeof child.type === "string" &&
      ["input", "select", "textarea"].includes(child.type)
    ) {
      const element = child as ReactElement<any>;
      return cloneElement(element, {
        "aria-labelledby": element.props["aria-labelledby"] || id,
        "aria-describedby":
          [element.props["aria-describedby"], ...helpers]
            .filter(Boolean)
            .join(" ") || undefined,
        "aria-invalid": error ? true : element.props["aria-invalid"],
      });
    }
    return child;
  });
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {controls}
      {error && (
        <small className="error" id={id + "-error"}>
          {error}
        </small>
      )}
    </label>
  );
}
export function Modal({ title, children, onClose, wide = false }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input,select,textarea,a[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={tx("Đóng")}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Badge({ children, tone = "" }: any) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function SectionTitle({ eyebrow, title, children }: any) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function ErrorBox({ children }: any) {
  return children ? (
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  ) : null;
}
export function Success({ children }: any) {
  return (
    <div className="success-box">
      <Check size={18} />
      {children}
    </div>
  );
}
export { ArrowRight };
