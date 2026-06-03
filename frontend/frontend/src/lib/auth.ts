/**
 * Auth utilities untuk check token dan validasi
 */

function readPublicEnv(name: string): string {
  const env = (import.meta as any).env ?? {};
  const value = env[name];
  return typeof value === "string" ? value : "";
}

function resolveCookieDomain(hostname: string) {
  const baseDomain = readPublicEnv("VITE_BASE_DOMAIN") || readPublicEnv("NEXT_PUBLIC_BASE_DOMAIN") || "localhost";
  if (hostname === "localhost" || hostname.startsWith("localhost:")) return "";
  return hostname.endsWith(baseDomain) ? `.${baseDomain}` : "";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  
  // Set ke cookie juga untuk middleware
  // Cookie harus share ke semua subdomain .kalako.local
  const hostname = window.location.hostname;
  const cookieDomain = resolveCookieDomain(hostname);
  
  const expiresDate = new Date();
  expiresDate.setTime(expiresDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 hari
  
  const domainPart = cookieDomain ? `; domain=${cookieDomain}` : "";
  const cookieString = `token=${token}; path=/` + domainPart + `; expires=${expiresDate.toUTCString()}`;
  document.cookie = cookieString;
  
  console.log("[AUTH] Token saved to localStorage and cookie");
  console.log("[AUTH] Cookie domain:", cookieDomain || "none (same-origin)");
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;

  // Admin token only needs to be available on root domain
  const hostname = window.location.hostname;
  const cookieDomain = resolveCookieDomain(hostname);

  const expiresDate = new Date();
  expiresDate.setTime(expiresDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const domainPart = cookieDomain ? `; domain=${cookieDomain}` : "";
  const cookieString = `admin_token=${token}; path=/` + domainPart + `; expires=${expiresDate.toUTCString()}`;
  document.cookie = cookieString;
  console.log("[AUTH] Admin token cookie set", cookieDomain || "(same-origin)");
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  
  // Clear cookie dengan domain yang sama
  const hostname = window.location.hostname;
  const cookieDomain = resolveCookieDomain(hostname);

  // Hapus cookie untuk kedua kemungkinan: tanpa domain dan dengan domain root
  // (penting karena beberapa browser menyimpan cookie dengan variasi berbeda)
  document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  if (cookieDomain) {
    document.cookie = `token=; path=/; domain=${cookieDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  }
  // clear admin_token if present
  document.cookie = `admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  if (cookieDomain) {
    document.cookie = `admin_token=; path=/; domain=${cookieDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to parse JWT:", err);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getUserFromToken(): any {
  const token = getToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }
  return parseJwt(token);
}
