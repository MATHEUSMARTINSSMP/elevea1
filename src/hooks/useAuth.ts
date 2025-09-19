import { useEffect, useState } from "react";

export type SessionUser = {
  email: string;
  role: "admin" | "client";
  siteSlug?: string;
};

type MeResp = {
  ok?: boolean;
  user?: SessionUser;
  error?: string;
  message?: string;
};

const AUTH_BASE  = "/.netlify/functions/auth-session";
const ME_URL     = `${AUTH_BASE}?action=me`;
const LOGOUT_URL = `${AUTH_BASE}?action=logout`;

function usePathname() {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const onLoginPage = pathname === "/login" || pathname === "/auth/login";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(ME_URL, { credentials: "include", cache: "no-store" });
        const data: MeResp = await r.json().catch(() => ({} as any));
        if (!alive) return;
        if (data?.ok && data.user) setUser(data.user);
        else setUser(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Falha ao carregar sessão");
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const isAdmin  = user?.role === "admin";
  const isClient = user?.role === "client";

  function go(url: string) { window.location.assign(url); }

  function requireAny(next?: string) {
    if (loading) return;
    if (!user && !onLoginPage) {
      const n = next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
      go(`/login${n}`);
    }
  }

  function requireAdmin(next?: string) {
    if (loading) return;
    if (!user && !onLoginPage) {
      const n = next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
      go(`/login${n}`);
      return;
    }
    if (user && user.role !== "admin" && !onLoginPage) {
      go("/client/dashboard");
    }
  }

  function requireClient(next?: string) {
    if (loading) return;
    if (!user && !onLoginPage) {
      const n = next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
      go(`/login${n}`);
      return;
    }
    if (user && user.role !== "client" && !onLoginPage) {
      go("/admin/dashboard");
    }
  }

  async function logout(to?: string) {
    try { await fetch(LOGOUT_URL, { credentials: "include" }); } catch {}
    go(to || "/login");
  }

  return {
    user, loading, error,
    isAdmin, isClient,
    requireAny, requireAdmin, requireClient,
    logout,
  };
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
