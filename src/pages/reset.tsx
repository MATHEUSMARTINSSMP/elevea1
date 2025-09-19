// src/pages/reset.tsx
import React, { useEffect, useState } from "react";
import { confirmPasswordReset } from "@/lib/auth";
import { sendCustomEmail } from "@/lib/email";

type ApiResp = { ok?: boolean; error?: string; message?: string };

// ajuste aqui se seu login estiver em outra rota:
const LOGIN_URL = "/login";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setEmail(p.get("email") || "");
    setToken(p.get("token") || "");
  }, []);

  // countdown + redirect automático após sucesso
  useEffect(() => {
    if (!success) return;
    if (seconds <= 0) {
      window.location.assign(LOGIN_URL);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [success, seconds]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !token) {
      setErr("Link inválido ou expirado.");
      return;
    }
    if (!pass1 || pass1.length < 6) {
      setErr("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      setErr("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      const resp = (await confirmPasswordReset(
        email,
        token,
        pass1
      )) as ApiResp;

      if (resp?.ok === false) {
        setErr(resp.error || resp.message || "Falha ao atualizar a senha.");
        setLoading(false);
        return;
      }

      setMsg("Senha atualizada! Você já pode fazer login.");
      setPass1("");
      setPass2("");
      setSuccess(true);
      setSeconds(5);

      // E-mail de confirmação (opcional)
      try {
        await sendCustomEmail(
          email,
          "Sua senha foi alterada",
          `<p>Olá,</p>
           <p>Confirmamos que sua senha foi alterada com sucesso.</p>
           <p>Se não foi você, responda este e-mail imediatamente.</p>
           <p>— Elevea</p>`
        );
      } catch {
        // silencioso
      }
    } catch (e: any) {
      setErr(e?.message || "Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Defina sua nova senha</h1>

        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full border rounded-xl px-4 py-3 bg-gray-100 text-gray-600"
            value={email}
            disabled
          />
          <input
            className="w-full border rounded-xl px-4 py-3"
            type="password"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            placeholder="Nova senha"
            disabled={loading || success}
          />
          <input
            className="w-full border rounded-xl px-4 py-3"
            type="password"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            placeholder="Repita a senha"
            disabled={loading || success}
          />
          <button
            className="w-full bg-black text-white rounded-xl py-3 disabled:opacity-50"
            disabled={loading || success}
          >
            {loading ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>

        {err && <div className="mt-4 text-red-600">{err}</div>}

        {msg && (
          <div className="mt-4 text-green-600 space-y-2">
            <p>{msg}</p>
            {success && (
              <>
                <button
                  className="w-full mt-2 border border-black text-black rounded-xl py-3 hover:bg-black hover:text-white transition"
                  onClick={() => window.location.assign(LOGIN_URL)}
                >
                  Ir para o login agora
                </button>
                <p className="text-sm text-gray-500 text-center">
                  Redirecionando automaticamente em {seconds}s…
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
