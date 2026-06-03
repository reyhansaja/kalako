const RESERVED_ROOT_SEGMENTS = new Set([
  "",
  "admin",
  "register",
  "root-login",
  "forgot-password",
  "landingpage",
  "about",
  "core-values",
  "fitur",
  "not",
]);

export function getTenantFromPathname(pathname: string): string {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  if (!firstSegment) return "";
  if (RESERVED_ROOT_SEGMENTS.has(firstSegment)) return "";
  if (firstSegment.includes(".")) return "";
  return firstSegment;
}

export function getTenantFromLocation(): string {
  if (typeof window === "undefined") return "";
  return getTenantFromPathname(window.location.pathname);
}

export function withTenantPath(path: string, tenant?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!tenant) return normalized;
  return `/${tenant}${normalized}`;
}
