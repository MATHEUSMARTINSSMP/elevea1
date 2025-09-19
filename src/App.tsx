// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WaitSession, RequireAuth, RequireClient, RedirectIfAuthed } from "@/routes/guards";

// ✅ Páginas (atenção ao caminho/case do Login!)
const IndexPage       = lazy(() => import("@/pages/index"));              // home pública em "/"
const LoginPage       = lazy(() => import("@/pages/auth/Login"));         // <-- caminho novo e correto
const ClientDashboard = lazy(() => import("@/pages/client/Dashboard"));
const AdminDashboard  = lazy(() => import("@/pages/admin/Dashboard"));

function Loader() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#0B1220]">
      <div className="text-gray-400 animate-pulse">Carregando…</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WaitSession>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* HOME PÚBLICA EM "/" */}
            <Route path="/" element={<IndexPage />} />

            {/* Login (se já estiver logado, manda para a área correta) */}
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              }
            />

            {/* Área do cliente (protegida) */}
            <Route
              path="/client/dashboard"
              element={
                <RequireAuth>
                  <RequireClient>
                    <ClientDashboard />
                  </RequireClient>
                </RequireAuth>
              }
            />

            {/* Área do admin (protegida) */}
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              }
            />

            {/* Qualquer coisa desconhecida → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </WaitSession>
    </BrowserRouter>
  );
}
