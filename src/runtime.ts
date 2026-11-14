type Runtime = {
  base: string;
  locale: string;
  routerBase: string;
  alternates: Record<string, string>;
};
const node = document.getElementById("od-runtime");
const initial: Partial<Runtime> = node
  ? JSON.parse(node.textContent || "{}")
  : {};
export const runtime: Runtime = {
  base: "/",
  locale: "en",
  routerBase: "",
  alternates: {},
  ...initial,
};
export const appBase = runtime.base;
export const isAdmin = () =>
  location.pathname.slice(appBase.length - 1).startsWith("/admin");
export function migrateLegacyLink() {
  if (location.hash.startsWith("#/")) {
    const path = location.hash.slice(1);
    history.replaceState(null, "", appBase.replace(/\/$/, "") + path);
    runtime.routerBase = appBase.replace(/\/$/, "");
    runtime.locale = "en";
  }
}

migrateLegacyLink();
