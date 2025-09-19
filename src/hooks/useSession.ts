import { useEffect, useState } from "react";

export type User = {
  email: string;
  role: "admin" | "client";
  siteSlug?: string;
  plan?: "vip" | "essential" | string;
};

const ME_URL = "/.netlify/functions/auth-session?action=me";

function readAuth(): User | null {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

export function useSession() {
  const [user, setUser] = useState<User | null>(() => readAuth());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch(ME_URL, { credentials: "include" });
        const data = await r.json().catch(() => ({} as any));

        if (!alive) return;

        if (data?.ok && data.user) {
          const merged: User = {
            email: data.user.email,
            role: data.user.role,
            siteSlug: (data.user as any).siteSlug || "",
            plan: (data.user as any).plan || "",
          };
          setUser(merged);
          try { localStorage.setItem("auth", JSON.stringify(merged)); } catch {}
        } else {
          setUser(null);
          try { localStorage.removeItem("auth"); } catch {}
        }
      } catch {
        // se ME falhar, mantém o que tiver no storage
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => { alive = false; };
  }, []);

  return { user, setUser, ready };
}
