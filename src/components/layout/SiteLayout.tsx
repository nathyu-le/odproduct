import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useStore } from "../../context";
import { tx } from "../../i18n";
import { Button, ErrorBox, Modal } from "../../ui";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileDock } from "./MobileDock";
export function SiteLayout({ renderCart }: { renderCart: () => ReactNode }) {
  const { error, data, cartOpen, setCartOpen } = useStore();
  return (
    <div className="catalogue-store">
      <button
        className="cx-skip"
        onClick={() => document.getElementById("store-content")?.focus()}
      >
        {tx("Đến nội dung chính")}
      </button>
      <Header />
      <main id="store-content" tabIndex={-1}>
        {error && !data ? (
          <div className="container page">
            <ErrorBox>{error}</ErrorBox>
            <Button onClick={() => location.reload()}>{tx("Thử lại")}</Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
      <MobileDock />
      {cartOpen && (
        <Modal
          title={tx("Giỏ hàng của bạn")}
          onClose={() => setCartOpen(false)}
        >
          {renderCart()}
        </Modal>
      )}
    </div>
  );
}
