import { useState, type CSSProperties } from "react";
import { useStore } from "../context";
import { runtime } from "../runtime";
import { brandAsset, defaultBranding } from "../branding";
export function BrandLogo({
  place = "header",
}: {
  place?: "header" | "footer" | "admin";
}) {
  const { data } = useStore();
  const b = data?.branding || runtime.branding || defaultBranding;
  const source = (place === "footer" && b.footer_logo) || b.logo;
  const url = source ? brandAsset(source, b.revision) : "";
  const [failed, setFailed] = useState("");
  const alt =
    b.logo_alt || data?.store?.name || runtime.storeName || b.wordmark;
  if (url && failed !== url)
    return (
      <img
        className={"site-brand-image in-" + place}
        style={
          {
            "--brand-width":
              (place === "footer"
                ? b.footer_logo_width
                : place === "admin"
                  ? Math.min(b.logo_width, 120)
                  : b.logo_width) + "px",
            "--brand-mobile-width": b.logo_mobile_width + "px",
          } as CSSProperties
        }
        src={url}
        alt={alt}
        onError={() => setFailed(url)}
      />
    );
  const word = b.wordmark || "od.";
  return (
    <span className="site-wordmark" role="img" aria-label={alt}>
      {word.endsWith(".") ? (
        <>
          {word.slice(0, -1)}
          <span>.</span>
        </>
      ) : (
        word
      )}
    </span>
  );
}
