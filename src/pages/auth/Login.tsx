import React, { useEffect, useMemo, useState } from "react";

// 👉 usa SEMPRE a mesma função (edge): auth-session
const AUTH_BASE = "/.netlify/functions/auth-session";
const LOGIN_URL = `${AUTH_BASE}?action=login`;
const ME_URL    = `${AUTH_BASE}?action=me`;
const RESET_URL = "/.netlify/functions/reset-dispatch";

type ApiResp = {
  ok?: boolean;
  error?: string;
  message?: string;
  user?: { email: string; role: "admin" | "client"; siteSlug?: string };
  link?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // pega ?next=/client/dashboard etc.
  const next = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const n = p.get("next") || "";
      return n.startsWith("/") ? n : "";
    } catch {
      return "";
    }
  }, []);

  // Se já tem sessão, manda direto
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(ME_URL, { credentials: "include", cache: "no-store" });
        const data: ApiResp = await r.json().catch(() => ({} as any));
        if (data?.ok && data.user) redirectByRole(data.user.role, next);
      } catch {}
    })();
  }, [next]);

  function redirectByRole(role: "admin" | "client", candidate?: string) {
    if (candidate) {
      if (role === "admin" && candidate.startsWith("/admin/")) { window.location.assign(candidate); return; }
      if (role === "client" && candidate.startsWith("/client/")) { window.location.assign(candidate); return; }
    }
    window.location.assign(role === "admin" ? "/admin/dashboard" : "/client/dashboard");
  }

  async function doLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);

    try {
      const emailLc = email.trim().toLowerCase();
      const r = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailLc, password: pass }),
      });

      // ajuda a diagnosticar 5xx
      if (r.status >= 500) {
        const txt = await r.text().catch(() => "");
        setErr(`Servidor indisponível (${r.status}). ${txt || ""}`.trim());
        return;
      }

      const data: ApiResp = await r.json().catch(() => ({} as any));
      if (!r.ok || data.ok === false) {
        setErr(data.error || data.message || `Falha no login (${r.status})`);
        return;
      }
      if (!data.user?.role) { setErr("Resposta inválida do servidor."); return; }
      redirectByRole(data.user.role, next);
    } catch (e: any) {
      setErr(e?.message || "Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  async function doForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      const r = await fetch(RESET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password_reset_request",
          email: forgotEmail.trim().toLowerCase()
        }),
      });
      const data: ApiResp = await r.json().catch(() => ({} as any));
      if (!r.ok || data.ok === false) {
        setErr(data.error || data.message || `Falha no reset (${r.status})`);
        return;
      }
      if (data.link) setMsg(`Link de reset: ${data.link}`);
      else setMsg("Se o e-mail existir, enviamos um link de reset.");
      setForgotOpen(false);
    } catch (e: any) {
      setErr(e?.message || "Erro de rede");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Entrar</h1>

        <form className="space-y-4" onSubmit={doLogin}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3 hover:bg-gray-800"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <button className="text-blue-600 underline" onClick={()=>setForgotOpen(true)}>
            Esqueci a senha
          </button>
        </div>

        {err && <div className="mt-4 text-red-600 whitespace-pre-wrap">{err}</div>}
        {msg && <div className="mt-4 text-green-600 break-words">{msg}</div>}
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reset de Senha</h2>
            <form className="space-y-4" onSubmit={doForgot}>
              <input
                type="email"
                placeholder="E-mail"
                value={forgotEmail}
                onChange={(e)=>setForgotEmail(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-black text-white rounded-xl px-4 py-2">
                  Enviar link
                </button>
                <button type="button" className="border rounded-xl px-4 py-2" onClick={()=>setForgotOpen(false)}>
                  Fechar
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              Você receberá um link para criar uma nova senha.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
