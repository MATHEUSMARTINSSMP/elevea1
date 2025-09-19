import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";

export default function ResetConfirmPage() {
  const { appsUrl } = useAuth();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [email] = useState(params.get("email") || "");
  const [token] = useState(params.get("token") || "");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");

  async function onConfirm() {
    setMsg("");
    try {
      const r = await fetch(appsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password_reset_confirm", email, token, password: pwd }),
      });
      const j = await r.json();
      if (j.ok) {
        setMsg("Senha atualizada! Você já pode fazer login.");
        setTimeout(()=>{ window.location.href = "/login"; }, 1200);
      } else {
        setMsg("Token inválido ou expirado.");
      }
    } catch {
      setMsg("Não foi possível redefinir agora.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
      <input type="password" className="w-full border rounded-xl px-4 py-3" placeholder="Nova senha"
             value={pwd} onChange={(e)=>setPwd(e.target.value)} />
      <Button className="bg-black text-white" onClick={onConfirm}>Confirmar nova senha</Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
