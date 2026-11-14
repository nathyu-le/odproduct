import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function ContentLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: ReactNode;
  className?: string;
  tabIndex?: number;
  "aria-label"?: string;
}) {
  return /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ) : (
    <Link to={href || "/products"} {...props}>
      {children}
    </Link>
  );
}
