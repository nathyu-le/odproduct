import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@fontsource-variable/inter';
import './styles.css';
import { StoreProvider } from './context';
import { Layout, Home, Catalog, Product, CartPage, Checkout, Order, Lookup } from './store';
const Admin = lazy(() => import('./admin').then((m) => ({ default: m.Admin })));
function Scroll() {
  const l = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const privatePage = /order\/|admin/.test(l.pathname);
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'robots';
      document.head.appendChild(m);
    }
    m.content = privatePage ? 'noindex,nofollow' : 'index,follow';
  }, [l.pathname]);
  return null;
}
class Boundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Đã có lỗi hiển thị</h1>
        <p>Giỏ hàng của bạn vẫn được lưu.</p>
        <button onClick={() => location.reload()}>Tải lại trang</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Boundary>
      <HashRouter>
        <StoreProvider>
          <Scroll />
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div className="loading">Đang tải quản trị…</div>}>
                  <Admin />
                </Suspense>
              }
            />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Catalog />} />
              <Route path="product/:slug" element={<Product />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:token" element={<Order />} />
              <Route path="lookup" element={<Lookup />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Trang không tồn tại</h1>
                    <a href="#/">Về trang chủ</a>
                  </div>
                }
              />
            </Route>
          </Routes>
        </StoreProvider>
      </HashRouter>
    </Boundary>
  </React.StrictMode>,
);
