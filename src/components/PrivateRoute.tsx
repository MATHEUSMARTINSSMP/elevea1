// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";

type Props = {
  roles?: Array<"admin" | "client">;
  children: React.ReactNode;
};

export default function PrivateRoute({ roles, children }: Props) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // logado porém papel errado → volta para raiz
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
