import { Check, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type Obj } from "./api";
import { localized, tx } from "./i18n";
type CartItem = { variant_id: number; quantity: number };
const Context = createContext<any>(null);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Obj | null>(null),
    [error, setError] = useState(""),
    [cart, setCart] = useState<CartItem[]>(() => {
      try {
        const c = JSON.parse(localStorage.getItem("od.cart") || "[]");
        return Array.isArray(c)
          ? c.filter((i) => Number.isInteger(i.variant_id) && i.quantity > 0)
          : [];
      } catch {
        return [];
      }
    }),
    [cartOpen, setCartOpen] = useState(false),
    [toast, setToast] = useState(""),
    [session, setSession] = useState<Obj | null>(null),
    [coupon, setCoupon] = useState(
      () => localStorage.getItem("od.coupon") || "",
    );
  const refresh = () =>
    api("catalog")
      .then((d) => {
        const categories = d.categories.map((c: Obj) => localized(c));
        setData({
          ...d,
          store: localized(d.store),
          products: d.products.map((p: Obj) => ({
            ...localized(p),
            category:
              categories.find((c: Obj) => c.id === p.category_id)?.name ||
              tx(p.category),
          })),
          categories,
        });
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    api("session")
      .then((s) => {
        setSession(s);
        return refresh();
      })
      .catch((e) => {
        setError(e.message);
        setSession({ user: null });
      });
  }, []);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("od.cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("od.coupon", coupon);
  }, [coupon]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const add = (variant_id: number, quantity = 1) => {
    setCart((c) => {
      const found = c.find((i) => i.variant_id === variant_id);
      return found
        ? c.map((i) =>
            i.variant_id === variant_id
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i,
          )
        : [...c, { variant_id, quantity }];
    });
    setToast(tx("Đã thêm vào giỏ hàng"));
  };
  const update = (id: number, qty: number) =>
    setCart((c) =>
      qty < 1
        ? c.filter((i) => i.variant_id !== id)
        : c.map((i) =>
            i.variant_id === id ? { ...i, quantity: Math.min(qty, 99) } : i,
          ),
    );
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  return (
    <Context.Provider
      value={{
        data,
        error,
        refresh,
        cart,
        setCart,
        add,
        update,
        count,
        cartOpen,
        setCartOpen,
        toast,
        setToast,
        session,
        setSession,
        coupon,
        setCoupon,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label={tx("Đóng thông báo")}
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
