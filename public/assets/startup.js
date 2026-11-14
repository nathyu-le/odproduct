/* Intentionally dependency-free: runs even if an app chunk cannot be downloaded. */
(() => {
  const splash = document.getElementById("od-splash");
  const root = document.getElementById("root");
  if (!splash || !root) return;
  splash.dataset.managed = "true";

  const copy = {
    en: [
      "Loading OD Store",
      "The store is taking longer to load. Check your connection and try again.",
      "Try again",
    ],
    vi: [
      "Đang tải OD Store",
      "Cửa hàng đang tải lâu hơn dự kiến. Kiểm tra kết nối rồi thử lại nhé.",
      "Thử lại",
    ],
    ko: [
      "OD Store 로딩 중",
      "스토어 로딩이 지연되고 있습니다. 연결을 확인한 후 다시 시도해 주세요.",
      "다시 시도",
    ],
    zh: [
      "正在加载 OD Store",
      "商店加载时间较长，请检查网络连接后重试。",
      "重试",
    ],
  }[document.documentElement.lang] || [
    "Loading OD Store",
    "Please check your connection and try again.",
    "Try again",
  ];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const started = performance.now();
  let signalled = false;
  let leaving = false;
  let imagePending = false;
  let imageSettled = false;
  let settle;
  let exit;
  root.inert = true;
  document.documentElement.classList.add("od-booting");
  root.setAttribute("aria-busy", "true");
  splash.setAttribute("aria-label", copy[0]);

  function finish() {
    if (leaving) return;
    leaving = true;
    clearTimeout(deadline);
    clearTimeout(settle);
    observer.disconnect();
    window.removeEventListener("od:content-ready", ready);
    root.inert = false;
    document.documentElement.classList.remove("od-booting");
    root.removeAttribute("aria-busy");
    splash.setAttribute("aria-hidden", "true");
    splash.classList.add("is-leaving");
    // A timed cleanup also works when a background tab skips transition events.
    setTimeout(() => splash.remove(), reduced ? 0 : 240);
  }

  function check() {
    if (
      !signalled ||
      leaving ||
      !root.hasChildNodes() ||
      root.querySelector(".loading")
    )
      return;
    const hero = root.querySelector('img[fetchpriority="high"]');
    if (hero && !hero.complete && !imageSettled) {
      if (!imagePending) {
        imagePending = true;
        let limit;
        Promise.race([
          hero.decode().catch(() => {}),
          new Promise((resolve) => {
            limit = setTimeout(resolve, 1000);
          }),
        ]).then(() => {
          clearTimeout(limit);
          imageSettled = true;
          check();
        });
      }
      return;
    }
    clearTimeout(exit);
    // One brief glint on fast connections; never wait for a full animation loop.
    exit = setTimeout(
      () => requestAnimationFrame(() => requestAnimationFrame(finish)),
      Math.max(0, (reduced ? 0 : 650) - (performance.now() - started)),
    );
  }

  function ready() {
    signalled = true;
    check();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(settle);
    settle = setTimeout(check, 0);
  });
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener("od:content-ready", ready);

  const deadline = setTimeout(() => {
    if (leaving) return;
    splash.classList.add("is-failed");
    splash.setAttribute("role", "alert");
    splash.removeAttribute("aria-label");
    const box = document.createElement("div");
    box.className = "od-splash-error";
    const message = document.createElement("p");
    message.textContent = copy[1];
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = copy[2];
    retry.onclick = () => location.reload();
    box.append(message, retry);
    splash.append(box);
  }, 15000);
  check();
})();
