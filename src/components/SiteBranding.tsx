import { useEffect } from "react";
import { useStore } from "../context";
import { brandAsset, defaultBranding, themeVariables } from "../branding";
import { runtime } from "../runtime";
export function SiteBranding() {
  const { data } = useStore();
  const b = data?.branding || runtime.branding || defaultBranding;
  useEffect(() => {
    for (const [key, value] of Object.entries(themeVariables(b)))
      document.documentElement.style.setProperty(key, value);
    for (const rel of ["icon", "apple-touch-icon"]) {
      let link = document.head.querySelector<HTMLLinkElement>(
        'link[rel="' + rel + '"]',
      );
      if (rel === "apple-touch-icon" && !b.favicon && !b.logo) {
        link?.remove();
        continue;
      }
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.append(link);
      }
      link.href = brandAsset(
        b.favicon || b.logo || "images/od-logo.svg",
        b.revision,
      );
    }
    const meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) meta.content = b.theme?.primary || "#313131";
  }, [b]);
  return null;
}
