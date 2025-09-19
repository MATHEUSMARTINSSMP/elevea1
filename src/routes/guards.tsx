// src/routes/guards.tsx
import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";

/**
 * Só renderiza children quando o hook já leu o storage (ready=true).
 * Enquanto isso, mostra um loading neutro para não "piscar".
 */
export function WaitSession({ children }: { children: React.ReactNode }) {
  const { ready } = useSession();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B1220] text-white/70">
        Carregando…
      </div>
    );
  }
  return <>{children}</>;
}

/** Exige estar logado; senão manda para /login (uma vez só) */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const did = useRef(false);
  const loc = useLocation();

  if (!ready) return null; // já tratado por WaitSession

  if (!user) {
    if (!did.current) did.current = true;
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  return <>{children}</>;
}

/** Só clientes. Admins vão para o painel de admin. */
export function RequireClient({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  if (!user) return null; // protegido por RequireAuth
  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Se já está logado, pula o /login para o destino correto. */
export function RedirectIfAuthed({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready } = useSession();
  const did = useRef(false);

  if (!ready) return null;

  if (user && !did.current) {
    did.current = true;
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/client/dashboard"}
        replace
      />
    );
  }
  return <>{children}</>;
}
