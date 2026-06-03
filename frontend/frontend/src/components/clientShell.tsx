"use client";

import { Link, useLocation, useParams } from "react-router-dom";
import { logout, getClientInfo, getApiBase } from "@/lib/api";
import { useEffect, useLayoutEffect, useState } from "react";
import { withTenantPath } from "@/lib/tenant";

export default function ClientShell({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = useLocation().pathname;
  const { tenant } = useParams();
  const tenantPath = (path: string) => withTenantPath(path, tenant);

  const [storeName, setStoreName] = useState("");
  const [storePhoto, setStorePhoto] = useState<string | null>(null);
  // when true the sidebar is collapsed to a narrow bar showing only the hamburger
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // keep the sidebar open state across navigation so it doesn't auto-close after clicks (hydrate instantly to avoid flash)
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("sidebarCollapsed");
    const initial = stored !== null ? stored === "true" : window.innerWidth < 768;
    setSidebarCollapsed(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "true" : "false");
  }, [sidebarCollapsed, hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Lock body scroll when mobile drawer is open.
    if (window.innerWidth >= 768) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = sidebarCollapsed ? "" : "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarCollapsed]);

  useEffect(() => {
    const fallbackName = (tenant || "").replace(/-/g, " ") || "Toko";
    setStoreName(fallbackName);

    // As a client-side fallback, check tenant status and redirect to suspended page if necessary
    (async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/tenant/status`, { cache: 'no-store' });
        if (res.ok) {
          const info = await res.json();
          const now = Date.now();
          let suspended = false;
          if ((info.status || '').toLowerCase() === 'suspended') suspended = true;
          else if (info.trial_ends_at) {
            const ends = Date.parse(info.trial_ends_at);
            if (!isNaN(ends) && ends < now) suspended = true;
          }
          if (suspended) {
            window.location.href = withTenantPath('/suspended', tenant);
            return;
          }
        }
      } catch (err) {
        console.error('tenant status check failed:', err);
      }

      // Get store photo from database via API
      getClientInfo()
        .then((data) => {
          if (data) {
            if (data.name) {
              setStoreName(String(data.name));
            }
            if (data.store_photo_url) {
              // Construct full URL with backend base URL
              const fullUrl = `${getApiBase()}${data.store_photo_url}`;
              setStorePhoto(fullUrl);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load client info:", err);
        });
    })();
  }, [tenant]);

  async function handleLogout() {
    if (confirm("Keluar dari akun?")) {
      try {
        await logout();
      } catch (err) {
        console.error("Logout error:", err);
        // fallback redirect
        window.location.href = tenantPath("/login");
      }
    }
  }

  function isActive(href: string, exact = false) {
    try {
      if (!pathname) return false;
      const normalize = (s: string) =>
        s.endsWith("/") && s.length > 1 ? s.slice(0, -1) : s;
      const p = normalize(pathname);
      const h = normalize(href);
      if (exact) return p === h;
      return p === h || p.startsWith(h + "/");
    } catch {
      return false;
    }
  }

  const sidebarContentState = sidebarCollapsed
    ? "opacity-0 -translate-x-2 pointer-events-none"
    : "opacity-100 translate-x-0 pointer-events-auto";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col md:flex-row">
      {/* Backdrop so clicking outside closes sidebar (all viewports) */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* NAVBAR MOBILE / SIDEBAR DESKTOP */}
      <aside className={`
        bg-white shadow md:sticky md:top-0 md:self-start md:flex-shrink-0
        ${sidebarCollapsed 
          ? 'fixed top-0 left-0 right-0 h-16 w-full z-50 md:sticky md:w-16 md:h-screen md:flex-col md:p-4 md:overflow-hidden' 
          : 'fixed top-0 left-0 h-screen w-[65%] max-w-[280px] z-50 md:sticky md:w-64 md:h-screen md:p-4 md:overflow-y-auto'
        }
        flex flex-col
      `}>
        {/* hamburger toggle (top center) - shown only when collapsed */}
        {sidebarCollapsed && (
          <div className="flex items-center justify-between px-4 md:flex-col md:gap-4 h-16 md:h-auto">
            <div className="hidden md:flex md:justify-center">
              <button
                aria-label="Open sidebar"
                className="p-2 rounded-md hover:bg-slate-100"
                onClick={() => setSidebarCollapsed(false)}
              >
                <span className="block w-6 h-[2px] bg-slate-800 mb-1" />
                <span className="block w-6 h-[2px] bg-slate-800 mb-1" />
                <span className="block w-6 h-[2px] bg-slate-800" />
              </button>
            </div>
            <button
              aria-label="Open menu"
              className="p-2 rounded-md hover:bg-slate-100 md:hidden"
              onClick={() => setSidebarCollapsed(false)}
            >
              <span className="block w-6 h-[2px] bg-slate-800 mb-1" />
              <span className="block w-6 h-[2px] bg-slate-800 mb-1" />
              <span className="block w-6 h-[2px] bg-slate-800" />
            </button>
          </div>
        )}

        {/* full content (kept mounted; show/hide via opacity to avoid remount delay) */}
        <div
          className={`flex flex-col h-full p-4 md:p-0 transition-all duration-150 ease-out ${sidebarContentState}`}
          aria-hidden={sidebarCollapsed}
        >
            {/* close button (top-right) - visible when expanded */}
            <div className="flex justify-between items-center mb-4 md:mb-0 md:absolute md:right-3 md:top-3">
              <h1 className="text-lg font-bold capitalize text-black md:hidden">
                {storeName}
              </h1>
              <button
                aria-label="Tutup menu"
                className="p-3 rounded-md hover:bg-slate-100 text-black font-extrabold text-xl -translate-y-[8px] md:-translate-y-[20px] translate-x-[10px] md:translate-x-[12px]"
                onClick={() => setSidebarCollapsed(true)}
              >
                ✕
              </button>
            </div>
            {/* Store Photo */}
            <div className="mb-4 hidden md:flex items-center gap-3">
              <Link to={tenantPath("/dashboard")} className="flex items-center gap-3">
                <img
                  src={storePhoto || "/kalako_logo.png"}
                  alt={storeName}
                  className="max-w-[100px] max-h-[100px] w-auto h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/kalako_logo.png";
                  }}
                />
              </Link>
              
            </div>

            {/* Store name - only desktop */}
            <div className="mb-2 text-[#181616] hidden md:block">
              <h1 className="text-2xl font-bold capitalize tracking-tight">
                {storeName}
              </h1>
            </div>

            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 hidden md:block">
              Main Menu
            </p>

          <nav className="flex flex-col gap-2 text-sm flex-1 md:mt-0 mt-6">
          <Link
            to={tenantPath("/dashboard")}
            className={`w-full px-4 py-3 rounded-lg text-[#181616] font-medium transition-all duration-200 flex items-center gap-3 ${
              isActive(tenantPath("/dashboard")) ? "bg-[#EBEEF0]" : "hover:bg-[#EBEEF0]"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src="/icons/dashboard.svg"
                alt="dashboard"
                className="w-[18px] h-[18px]"
              />
            </div>
            <span>Dashboard</span>
          </Link>

          <Link
            to={tenantPath("/stok-retail")}
            className={`w-full px-4 py-3 rounded-lg text-[#181616] font-medium transition-all duration-200 flex items-center gap-3 ${
              isActive(tenantPath("/stok-retail")) ? "bg-[#EBEEF0]" : "hover:bg-[#EBEEF0]"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src="/icons/box.svg"
                alt="stok"
                className="w-[18px] h-[18px]"
              />
            </div>
            <span>Stok Retail</span>
          </Link>

          <Link
            to={tenantPath("/transaksi")}
            className={`w-full px-4 py-3 rounded-lg text-[#181616] font-medium transition-all duration-200 flex items-center gap-3 ${
              isActive(tenantPath("/transaksi"), true)
                ? "bg-[#EBEEF0]"
                : "hover:bg-[#EBEEF0]"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src="/icons/card.svg"
                alt="transaksi"
                className="w-[18px] h-[18px]"
              />
            </div>
            <span>Transaksi Kasir</span>
          </Link>

          <Link
            to={tenantPath("/transaksi/histori")}
            className={`w-full px-4 py-3 rounded-lg text-[#181616] font-medium transition-all duration-200 flex items-center gap-3 ${
              isActive(tenantPath("/transaksi/histori"))
                ? "bg-[#EBEEF0]"
                : "hover:bg-[#EBEEF0]"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src="/icons/history.svg"
                alt="histori"
                className="w-[18px] h-[18px]"
              />
            </div>
            <span>Histori Transaksi</span>
          </Link>

          <Link
            to={tenantPath("/laporan")}
            className={`w-full px-4 py-3 rounded-lg text-[#181616] font-medium transition-all duration-200 flex items-center gap-3 ${
              isActive(tenantPath("/laporan")) ? "bg-[#EBEEF0]" : "hover:bg-[#EBEEF0]"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src="/icons/report.svg"
                alt="laporan"
                className="w-[18px] h-[18px]"
              />
            </div>
            <span>Laporan Keuangan</span>
          </Link>
          </nav>

            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all duration-200"
              >
                Logout
              </button>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 ${sidebarCollapsed ? 'pt-20 md:pt-6' : 'pt-20 md:pt-6'}`}>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-slate-900">
          {title}
        </h2>
        {children}
      </main>
    </div>
  );
}
