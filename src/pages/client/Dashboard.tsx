import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/useSession";

/* ================= CONFIG ================= */
const PLAN_TIMEOUT_MS = 7000;         // descobrir VIP
const CARDS_TIMEOUT_MS = 15000;       // cards paralelo
const UPGRADE_URL =
  import.meta.env.VITE_UPGRADE_URL ||
  "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=99dceb0e108a4f238a84fbef3e91bab8";

/* Paletas demo */
const PALETAS = [
  { name: "Azul Futurista", colors: ["#0f172a", "#3b82f6", "#38bdf8"] },
  { name: "Verde Tech", colors: ["#064e3b", "#10b981", "#34d399"] },
  { name: "Roxo Premium", colors: ["#312e81", "#8b5cf6", "#a78bfa"] },
  { name: "Laranja Energia", colors: ["#7c2d12", "#f97316", "#fb923c"] },
];

/* ================= Tipos ================= */
type StatusResp = {
  ok: boolean;
  siteSlug: string;
  plan?: string;
  status?: string;
  nextCharge?: string | null;
  lastPayment?: { date: string; amount: number } | null;
};
type ClientSettings = {
  heroTitle?: string;
  aboutText?: string;
  services?: Array<{ title: string; description?: string }>;
  colors?: string[];
};
type ImageSlot = { key: string; label: string; url?: string };
type Feedback = {
  id: string;
  timestamp: string;
  name?: string;
  rating?: number;
  comment?: string;
  email?: string;
  phone?: string;
  approved?: boolean;
};

/* ================= Helpers ================= */
const norm = (s?: string) => String(s ?? "").trim().toLowerCase();
const looksVip = (p?: string) => !!p && (norm(p) === "vip" || norm(p).includes("vip"));
const isActiveStatus = (s?: string) =>
  ["approved", "authorized", "active", "processing", "in_process", "charged", "authorized_pending_capture"]
    .includes(norm(s));

const fmtDateTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s as string;
  return (
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
};

/* ===== fetch com timeout real (AbortController) ===== */
async function getJSON<T = any>(url: string, ms: number): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { credentials: "include", signal: ctl.signal });
    const text = await r.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

async function postJSON<T = any>(url: string, body: any, ms: number): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const text = await r.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ================= Página ================= */
export default function ClientDashboard() {
  const { user } = useSession();
  const canQuery = !!user?.email && !!user?.siteSlug && user?.role === "client";

  /* Plano / gate VIP */
  const [plan, setPlan] = useState<string | null>(null); // null=desconhecido
  const [checkingPlan, setCheckingPlan] = useState(false);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const cacheKey = `dashboard:lastPlan:${user?.siteSlug || ""}`;
  const onceRef = useRef(false);
  const [planFetchTick, setPlanFetchTick] = useState(0); // força refetch

  /* Outros cards */
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [settings, setSettings] = useState<ClientSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  const [slots, setSlots] = useState<ImageSlot[]>(
    Array.from({ length: 6 }).map((_, i) => ({ key: `media_${i + 1}`, label: `Mídia ${i + 1}` }))
  );
  const [loadingAssets, setLoadingAssets] = useState(true);

  const [vipPin, setVipPin] = useState("");
  const [saving, setSaving] = useState(false);

  // VIP habilita se QUALQUER fonte indicar isso
  const vipEnabled =
    looksVip(plan || undefined) ||
    looksVip(status?.plan) ||
    isActiveStatus(status?.status);

  const planLabel = plan === null ? "—" : (vipEnabled ? "vip" : (plan || "—"));

  // Redireciona admin
  useEffect(() => {
    if (user?.role === "admin") window.location.replace("/admin/dashboard");
  }, [user?.role]);

  /* 1) Usa cache para abrir rápido, depois valida no backend (client-plan) */
  useEffect(() => {
    if (!canQuery) return;

    // abre com último plano conhecido (se existir)
    if (!onceRef.current) {
      onceRef.current = true;
      try {
        const last = sessionStorage.getItem(cacheKey);
        if (last) setPlan(last);
      } catch {}
    }

    let alive = true;
    (async () => {
      setCheckingPlan(true);
      setPlanErr(null);
      try {
        const r = await getJSON<{
          ok: boolean;
          vip: boolean;
          plan: string;
          status?: string;
          nextCharge?: string | null;
          lastPayment?: { date: string; amount: number } | null;
        }>(
          `/.netlify/functions/client-plan?site=${encodeURIComponent(user!.siteSlug!)}&email=${encodeURIComponent(
            user!.email
          )}`,
          PLAN_TIMEOUT_MS
        );

        if (!alive) return;
        const resolvedPlan = r.vip ? "vip" : (r.plan || "");
        setPlan(resolvedPlan);
        try { sessionStorage.setItem(cacheKey, resolvedPlan); } catch {}

        // hidrata cards com o que já veio
        setStatus((prev) => ({
          ...(prev || { ok: true, siteSlug: user!.siteSlug! }),
          status: r.status || prev?.status,
          nextCharge: r.nextCharge ?? prev?.nextCharge ?? null,
          lastPayment: r.lastPayment ?? prev?.lastPayment ?? null,
          plan: resolvedPlan,
        }));
      } catch (e: any) {
        setPlanErr("Não foi possível validar sua assinatura agora.");
      } finally {
        if (alive) setCheckingPlan(false);
      }
    })();

    return () => { alive = false; };
  }, [canQuery, user?.siteSlug, user?.email, planFetchTick]);

  const retryPlan = () => {
    try { sessionStorage.removeItem(cacheKey); } catch {}
    setPlan(null);
    setPlanErr(null);
    setLoadingStatus(true);
    setPlanFetchTick((n) => n + 1);
  };

  /* 2) Cards em paralelo (não bloqueiam a decisão VIP) */
  useEffect(() => {
    if (!canQuery) return;
    let alive = true;

    // STATUS (completo)
    (async () => {
      try {
        const s = await getJSON<StatusResp>(
          `/.netlify/functions/client-api?action=get_status&site=${encodeURIComponent(user!.siteSlug!)}`,
          CARDS_TIMEOUT_MS
        );
        if (!alive) return;
        setStatus(s);
        // redundância para garantir VIP cedo
        if (!looksVip(plan || undefined) && (looksVip(s.plan) || isActiveStatus(s.status))) {
          setPlan("vip");
          try { sessionStorage.setItem(cacheKey, "vip"); } catch {}
        }
      } catch {}
      finally {
        if (alive) setLoadingStatus(false);
      }
    })();

    // SETTINGS
    (async () => {
      try {
        const st = await getJSON<{ ok: boolean; settings?: ClientSettings }>(
          `/.netlify/functions/client-api?action=get_settings&site=${encodeURIComponent(user!.siteSlug!)}`,
          CARDS_TIMEOUT_MS
        ).catch(() => ({ ok: true, settings: {} as ClientSettings }));
        if (!alive) return;
        setSettings((prev) => ({ ...prev, ...(st.settings || {}) }));
      } catch {}
      finally {
        if (alive) setLoadingSettings(false);
      }
    })();

    // ASSETS
    (async () => {
      try {
        const assets = await getJSON<{ ok: boolean; items: Array<{ key: string; url: string }> }>(
          `/.netlify/functions/assets?site=${encodeURIComponent(user!.siteSlug!)}`,
          CARDS_TIMEOUT_MS
        ).catch(() => ({ ok: true, items: [] as any[] }));
        if (!alive) return;
        const urlByKey = new Map(assets.items.map((i) => [i.key, i.url]));
        const ALIASES: Record<string, string[]> = {
          media_1: ["media_1", "hero", "banner", "principal"],
          media_2: ["media_2", "destaque_1", "gallery_1"],
          media_3: ["media_3", "destaque_2", "gallery_2"],
          media_4: ["media_4", "gallery_3"],
          media_5: ["media_5", "gallery_4"],
          media_6: ["media_6", "gallery_5"],
        };
        setSlots((prev) =>
          prev.map((sl) => {
            const hit = (ALIASES[sl.key] || [sl.key]).find((k) => urlByKey.get(k));
            return { ...sl, url: hit ? (urlByKey.get(hit) as string) : sl.url };
          })
        );
      } catch {}
      finally {
        if (alive) setLoadingAssets(false);
      }
    })();

    // FEEDBACKS (usa action existente no backend)
    (async () => {
      try {
        const fb = await getJSON<{ ok: boolean; items: Feedback[] }>(
          `/.netlify/functions/client-api?action=list_feedbacks&site=${encodeURIComponent(user!.siteSlug!)}`,
          CARDS_TIMEOUT_MS
        ).catch(() => ({ ok: true, items: [] as Feedback[] }));
        if (!alive) return;
        setFeedbacks(fb.items || []);
      } catch {}
      finally {
        if (alive) setLoadingFeedbacks(false);
      }
    })();

    return () => { alive = false; };
  }, [canQuery, user?.siteSlug, user?.email]);

  /* Ações */
  async function saveSettings(partial: Partial<ClientSettings>) {
    if (!canQuery) return;
    setSaving(true);
    try {
      const payload = { ...settings, ...partial };
      const res = await postJSON<{ ok: boolean }>(
        "/.netlify/functions/client-api",
        { action: "save_settings", site: user!.siteSlug!, settings: payload, pin: vipPin || undefined },
        CARDS_TIMEOUT_MS
      );
      if (!res.ok) throw new Error("Falha ao salvar");
      setSettings(payload);
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(slot: ImageSlot, file: File) {
    if (!canQuery) return;
    const fd = new FormData();
    fd.append("site", user!.siteSlug!);
    fd.append("section", "generic");
    fd.append("key", slot.key);
    fd.append("file", file);
    fd.append("email", user!.email);
    const r = await fetch("/.netlify/functions/assets", { method: "PUT", body: fd, credentials: "include" });
    const data = await r.json().catch(() => ({} as any));
    if (!r.ok || data.ok === false) throw new Error(data?.error || `Falha no upload (${r.status})`);
    const newUrl: string = data.url;
    setSlots((prev) => prev.map((s) => (s.key === slot.key ? { ...s, url: newUrl } : s)));
  }

  async function setFeedbackApproval(id: string, approved: boolean) {
    if (!canQuery) return;
    try {
      await postJSON(
        "/.netlify/functions/client-api",
        { action: "feedback_set_approval", site: user!.siteSlug!, id, approved, pin: vipPin || undefined },
        CARDS_TIMEOUT_MS
      );
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, approved } : f)));
    } catch (e: any) {
      alert(e?.message || "Não foi possível atualizar a aprovação.");
    }
  }

  function logout() {
    try { localStorage.removeItem("auth"); } catch {}
    window.location.href = "/login";
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B1220] p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="rounded-2xl border border-white/10 bg-white text-slate-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-elevea.png" alt="ELEVEA" className="h-6 w-auto" />
            <div className="text-xs md:text-sm text-slate-600">
              {user.email} {user.siteSlug ? `• ${user.siteSlug}` : "• sem site"} {`• ${planLabel}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vipEnabled ? (
              <>
                <span className="rounded-xl bg-emerald-500/15 text-emerald-700 border border-emerald-300 px-3 py-1 text-xs font-medium">VIP ativo</span>
                <input
                  value={vipPin}
                  onChange={(e) => setVipPin(e.target.value)}
                  placeholder="PIN VIP"
                  className="rounded-xl bg-white/70 text-black px-3 py-2 text-xs"
                />
              </>
            ) : checkingPlan ? (
              <span className="rounded-xl bg-slate-200 text-slate-700 px-3 py-2 text-xs">Verificando…</span>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={UPGRADE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium hover:bg-emerald-400 text-black"
                >
                  Desbloquear VIP
                </a>
                <button
                  onClick={retryPlan}
                  className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs hover:opacity-90"
                  title="Se você é VIP e não apareceu, tente novamente"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            <button onClick={logout} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90">
              Sair
            </button>
          </div>
        </header>

        {planErr ? (
          <div className="rounded-2xl bg-yellow-900/30 border border-yellow-700/50 text-yellow-100 px-4 py-3">
            {planErr}
          </div>
        ) : null}

        {/* RESUMO */}
        <section className="grid md:grid-cols-4 gap-4">
          <Card title="Status" value={loadingStatus ? "—" : status?.status ? status.status.toUpperCase() : "—"} />
          <Card title="Plano" value={planLabel} />
          <Card title="Próxima Cobrança" value={loadingStatus ? "—" : fmtDateTime(status?.nextCharge)} />
          <Card title="Último Pagamento" value={
            loadingStatus ? "—" :
              status?.lastPayment ? `${fmtDateTime(status.lastPayment.date)} • R$ ${status.lastPayment.amount.toFixed(2)}` : "—"
          }/>
        </section>

        {/* GATE VIP */}
        <VipGate
          enabled={vipEnabled}
          checking={checkingPlan}
          teaser="No VIP você pode trocar imagens, textos e cores do seu site em tempo real."
        >
          {/* Mídias */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Banco de Mídias</h3>
              <div className="text-xs text-white/60">
                Dica: envie arquivos na pasta do Drive: <em>Elevea Sites / SITE-{user?.siteSlug} / logo, fotos</em>.
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <ImageCard
                  key={slot.key}
                  slot={slot}
                  loading={loadingAssets}
                  onSelectFile={async (f) => {
                    try { await handleUpload(slot, f); }
                    catch (e: any) { alert(e?.message || "Falha no upload"); }
                  }}
                />
              ))}
            </div>
          </section>

          {/* Textos */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h3 className="font-semibold">Textos &amp; Títulos</h3>
            <div className="grid gap-2 max-w-2xl">
              <label className="text-sm text-white/70">Título do topo (Hero)</label>
              <input
                disabled={loadingSettings}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-white/40 disabled:opacity-60"
                placeholder="Ex.: Sua empresa, seu próximo nível"
                value={settings.heroTitle || ""}
                onChange={(e) => setSettings((s) => ({ ...s, heroTitle: e.target.value }))}
              />
            </div>
            <div className="grid gap-2 max-w-2xl">
              <label className="text-sm text-white/70">Texto da seção “Sobre”</label>
              <textarea
                disabled={loadingSettings}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-white/40 min-h-[100px] disabled:opacity-60"
                placeholder="Conte em poucas linhas a história ou diferencial do seu negócio."
                value={settings.aboutText || ""}
                onChange={(e) => setSettings((s) => ({ ...s, aboutText: e.target.value }))}
              />
            </div>

            {settings.services && settings.services.length > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  {settings.services.map((svc, idx) => (
                    <div key={idx} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                      <label className="text-sm text-white/70">Serviço {idx + 1}</label>
                      <input
                        disabled={loadingSettings}
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white placeholder-white/40 disabled:opacity-60"
                        placeholder={`Título do serviço ${idx + 1}`}
                        value={svc.title}
                        onChange={(e) => {
                          setSettings((s) => {
                            const next = [...(s.services || [])];
                            next[idx] = { ...next[idx], title: e.target.value };
                            return { ...s, services: next };
                          });
                        }}
                      />
                      <textarea
                        disabled={loadingSettings}
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white placeholder-white/40 min-h-[80px] disabled:opacity-60"
                        placeholder="Descrição (opcional)"
                        value={svc.description || ""}
                        onChange={(e) => {
                          setSettings((s) => {
                            const next = [...(s.services || [])];
                            next[idx] = { ...next[idx], description: e.target.value };
                            return { ...s, services: next };
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-white/60">* Se sua landing não usa “Serviços”, basta deixar em branco — nada será publicado.</div>
              </>
            ) : (
              <div className="text-sm text-white/60">Esta landing não usa cards de serviços.</div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => saveSettings({})}
                disabled={saving || loadingSettings}
                className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </section>

          {/* Cores */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h3 className="font-semibold">Personalize as cores do site</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PALETAS.map((p) => (
                <button
                  key={p.name}
                  disabled={loadingSettings}
                  onClick={() => saveSettings({ colors: p.colors })}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col items-center hover:border-white/30 disabled:opacity-60"
                >
                  <div className="flex gap-1 mb-2">
                    {p.colors.map((c) => <div key={c} className="w-6 h-6 rounded" style={{ backgroundColor: c }} />)}
                  </div>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>

            {settings.colors?.length ? (
              <div className="text-sm text-white/70">
                <div className="mt-4">Paleta selecionada:</div>
                <div className="flex gap-2 mt-2">
                  {settings.colors.map((c) => (
                    <span key={c} className="inline-flex items-center justify-center rounded px-2 py-1 border border-white/10" style={{ backgroundColor: c }}>
                      <span className="text-[10px] mix-blend-difference">{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Feedbacks */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Feedbacks de Clientes</h3>
              <div className="text-xs text-white/60">E-mail e telefone ficam **somente aqui** (não são publicados).</div>
            </div>

            {loadingFeedbacks ? (
              <div className="text-white/60 text-sm">Carregando…</div>
            ) : feedbacks.length === 0 ? (
              <div className="text-white/60 text-sm">Nenhum feedback ainda.</div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((f) => (
                  <div key={f.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{fmtDateTime(f.timestamp)}</span>
                      {f.approved ? (
                        <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5">Publicado</span>
                      ) : (
                        <span className="rounded bg-yellow-500/20 text-yellow-300 px-2 py-0.5">Pendente</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm flex flex-wrap gap-x-2 gap-y-1">
                      <span className="font-medium">{f.name || "Cliente"}</span>
                      {typeof f.rating === "number" ? <span>• {f.rating}/5</span> : null}
                      {f.email ? <span className="text-white/60">• {f.email}</span> : null}
                      {f.phone ? <span className="text-white/60">• {f.phone}</span> : null}
                    </div>
                    {f.comment ? <div className="mt-1 text-white/80">{f.comment}</div> : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setFeedbackApproval(f.id, true)}
                        disabled={!vipPin}
                        className="rounded-lg bg-emerald-500 text-black px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                        title={vipPin ? "" : "Informe o PIN VIP no topo"}
                      >
                        Publicar
                      </button>
                      <button
                        onClick={() => setFeedbackApproval(f.id, false)}
                        disabled={!vipPin}
                        className="rounded-lg bg-slate-700 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                        title={vipPin ? "" : "Informe o PIN VIP no topo"}
                      >
                        Ocultar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </VipGate>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Card({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm text-white/70">{title}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function VipGate({
  enabled, checking, children, teaser,
}: { enabled: boolean; checking?: boolean; teaser: string; children: React.ReactNode; }) {
  if (enabled) return <>{children}</>;
  if (checking) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-70">{children}</div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-[#0B1220]/80 to-[#0B1220]" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-sm text-white">
            Verificando sua assinatura…
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[1.1px] opacity-80">{children}</div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-[#0B1220]/80 to-[#0B1220]" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-white">{teaser}</div>
          <a
            href={UPGRADE_URL}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400"
          >
            Fazer upgrade
          </a>
        </div>
      </div>
    </div>
  );
}

function ImageCard({
  slot, loading, onSelectFile,
}: { slot: ImageSlot; loading?: boolean; onSelectFile: (file: File) => Promise<void>; }) {
  const [busy, setBusy] = useState(false);
  const showBusy = busy || loading;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="aspect-video bg-black/30 grid place-items-center">
        {slot.url ? <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" /> :
          <span className="text-white/40 text-sm">{loading ? "Carregando…" : "Sem imagem"}</span>}
      </div>
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="text-sm text-white/80">{slot.label}</div>
        <label className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm cursor-pointer ${
          showBusy ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-white text-black hover:bg-white/90"
        }`}>
          {showBusy ? "Aguarde…" : "Trocar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={showBusy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try { await onSelectFile(f); }
              finally { setBusy(false); e.currentTarget.value = ""; }
            }}
          />
        </label>
      </div>
    </div>
  );
}
