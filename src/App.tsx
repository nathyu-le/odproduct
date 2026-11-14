import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Seo } from "./components/Seo";
import { SiteBranding } from "./components/SiteBranding";
import { StoreProvider } from "./context";
import { I18nProvider, tx } from "./i18n";
import { runtime } from "./runtime";
import { signalContentReady } from "./startup";
import {
  CartPage,
  Catalog,
  Checkout,
  FlashSales,
  Home,
  Layout,
  Lookup,
  Order,
  Product,
} from "./store";
const BlogList = lazy(() =>
  import("./features/blog/BlogList").then((m) => ({ default: m.BlogList })),
);
const BlogPost = lazy(() =>
  import("./features/blog/BlogPost").then((m) => ({ default: m.BlogPost })),
);
const Admin = lazy(() => import("./admin").then((m) => ({ default: m.Admin })));
function Scroll() {
  const location = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return null;
}
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    signalContentReady();
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>{tx("Đã có lỗi hiển thị")}</h1>
        <p>{tx("Giỏ hàng của bạn vẫn được lưu.")}</p>
        <button onClick={() => location.reload()}>{tx("Tải lại trang")}</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <I18nProvider>
        <BrowserRouter basename={runtime.routerBase || "/"}>
          <StoreProvider>
            <Scroll />
            <Seo />
            <SiteBranding />
            <Routes>
              <Route
                path="/admin/*"
                element={
                  <Suspense
                    fallback={
                      <div className="loading">{tx("Đang tải quản trị…")}</div>
                    }
                  >
                    <Admin />
                  </Suspense>
                }
              />
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Catalog />} />
                <Route
                  path="blog"
                  element={
                    <Suspense
                      fallback={<div className="loading">Loading…</div>}
                    >
                      <BlogList />
                    </Suspense>
                  }
                />
                <Route
                  path="blog/:slug"
                  element={
                    <Suspense
                      fallback={<div className="loading">Loading…</div>}
                    >
                      <BlogPost />
                    </Suspense>
                  }
                />
                <Route path="flash-sale" element={<FlashSales />} />
                <Route path="product/:slug" element={<Product />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order/:token" element={<Order />} />
                <Route path="lookup" element={<Lookup />} />
                <Route
                  path="*"
                  element={
                    <div className="empty">
                      <h1>{tx("Trang không tồn tại")}</h1>
                      <Link to="/">{tx("Về trang chủ")}</Link>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </StoreProvider>
        </BrowserRouter>
      </I18nProvider>
    </Boundary>
  </React.StrictMode>,
);
