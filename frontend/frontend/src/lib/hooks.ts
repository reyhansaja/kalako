/**
 * Custom hook untuk protect pages yang memerlukan authentication
 */

"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUserFromToken } from "@/lib/auth";
import { getTenantFromLocation, withTenantPath } from "@/lib/tenant";

interface UseProtectedPageOptions {
  redirectTo?: string;
}

/**
 * Hook untuk melindungi halaman yang memerlukan login
 * Jika user belum login, otomatis redirect ke /login
 * 
 * Usage:
 * ```tsx
 * const { isReady } = useProtectedPage();
 * if (!isReady) return <LoadingScreen />;
 * return <YourComponent />;
 * ```
 */
export function useProtectedPage(options: UseProtectedPageOptions = {}) {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only run once on mount - prevent infinite loop
    if (checked) return;
    
    setChecked(true);

    // Check auth status
    if (!isAuthenticated()) {
      // Belum login, redirect ke login page
      const tenant = getTenantFromLocation();
      navigate(options.redirectTo || withTenantPath("/login", tenant), { replace: true });
      return;
    }

    // Get user data dari token
    const userData = getUserFromToken();
    setUser(userData);
    setIsReady(true);
  }, []); // Empty dependency array - run only once on mount

  return { isReady, user };
}

/**
 * Hook untuk monitoring login status
 * Useful untuk update UI ketika user login/logout
 */
export function useAuthStatus() {
  const [isAuthenticated_state, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAuthenticated();
      setIsAuthenticated(auth);
      if (auth) {
        setUser(getUserFromToken());
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen untuk storage changes (logout dari tab lain)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return { isAuthenticated: isAuthenticated_state, user, isLoading };
}
