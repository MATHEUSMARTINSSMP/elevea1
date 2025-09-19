// src/pages/client/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { Lock, ArrowUpRight } from "lucide-react";

/** =========================
 *  Ajuste estas 3 URLs:
 *  - STATUS_FN: endpoint que retorna { ok, plan, status, nextCharge, history[] }
 *  - ASSETS_FN: endpoint para listar e enviar mídias (mantém sua semântica atual)
 *  - UPGRADE_URL: link para upgrade VIP (pode ser /upgrade ou WhatsApp)
 * ========================= */
const STATUS_FN   = "/.netlify/functions/subscription-status";
const ASSETS_FN   = "/.netlify/functions/assets";
const UPGRADE_URL = "/upgrade"; // ou WhatsApp de vendas

type StatusResp = {
  ok: boolean;
  siteSlug: string;
  plan?: "vip" | "essential";
  status?: "active" | "paused" | "canceled" | "pending";
  nextCharge?: string | null;
  lastPayment?: { date: string; amount: number } | null;
  history?: Array<{ id: string; date: string; amount: number; status: string }>;
};

type MediaSlot = { key: string; label: string; url?: string };

async function getJSON<T = any>(url: string) {
  const r = await fetch(url, { credentials: "include" });
  const data = (await r.json().catch(() => ({}))) as T;
  if (!r.ok) throw new Error((data as any)?.error || `HTTP ${r.status}`);
  return data;
}

/** ———————————————————————
 *   BLOQUEIO / TEASER VIP
 * ——————————————————————— */
function Locked({
  locked,
  children,
  className = "",
  ctaText = "Ativar VIP",
  hint,
}: {
  locked: boolean;
  children: React.ReactNode;
  className?: string;
  ctaText?: string;
  hint?: string;
}) {
  if (!locked) return <div className={className}>{children}</div>;
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none blur-[1.5px] opacity-60">{children}</div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-2xl bg-black/80 text-white p-5 text-center max-w-sm">
          <div className="mx-auto mb-2 h-9 w-9 grid place-items-center rounded-full bg-white/10">
            <Lock className="h-4 w-4" />
          </div>
          <div className="font-semibold">Recurso exclusivo do VIP</div>
          {hint && <div className="text-sm text-white/80 mt-1">{hint}</div>}
          <a
            href={UPGRADE_URL}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
          >
            {ctaText} <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/** ———————————————————————
 *   DASHBOARD DO CLIENTE
 * ——————————————————————— */
export default function ClientDashboard() {
  const { user } = useSession(); // { email, role, siteSlug? }
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isVIP = (status?.plan || "").toLowerCase() === "vip";
  const locked = !isVIP;

  // Slots de mídia genéricos — valem para qualquer template
  const initialSlots = useMemo<MediaSlot[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        key: `media-${i + 1}`,
        label: `Mídia ${i + 1}`,
      })),
    []
  );
  const [slots, setSlots] = useState<MediaSlot[]>(initialSlots);

  // Admin → redireciona
  useEffect(() => {
    if (user?.role === "admin") window.location.replace("/admin/dashboard");
  }, [user?.role]);

  // Carrega status + assets
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!user || user.role === "admin") return;
      if (!user.siteSlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const s = await getJSON<StatusResp>(`${STATUS_FN}?site=${encodeURIComponent(user.siteSlug)}`);
        if (!alive) return;
        setStatus(s);

        const assets = await getJSON<{ ok: boolean; items: Array<{ key: string; url: string }> }>(
          `${ASSETS_FN}?site=${encodeURIComponent(user.siteSlug)}`
        ).catch(() => ({ ok: true, items: [] as any[] }));
        if (!alive) return;

        const map = new Map(assets.items.map((i) => [i.key, i.url]));
        setSlots((prev) => prev.map((sl) => ({ ...sl, url: map.get(sl.key) })));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Erro ao carregar dados");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [user?.siteSlug, user?.role]);

  async function handleUpload(slot: MediaSlot, file: File) {
    if (!user?.siteSlug) return;
    const fd = new FormData();
    fd.append("site", user.siteSlug);
    fd.append("key", slot.key);
    fd.append("file", file);

    const r = await fetch(ASSETS_FN, { method: "PUT", body: fd, credentials: "include" });
    const data = await r.json().catch(() => ({} as any));
    if (!r.ok || data.ok === false) throw new Error(data?.error || `Falha no upload (${r.status})`);
    const newUrl: string = data.url;
    setSlots((prev) => prev.map((s) => (s.key === slot.key ? { ...s, url: newUrl } : s)));
  }

  if (loading && !user?.siteSlug) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Carregando sua área…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Área do Cliente</h1>
            <p className="text-sm text-gray-500">
              {user.email} {user.siteSlug ? `• ${user.siteSlug}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={`Plano: ${status?.plan || "—"}`} />
            <Badge label={`Status: ${status?.status || "—"}`} />
            {!isVIP && (
              <a
                href={UPGRADE_URL}
                className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
              >
                Ativar VIP
              </a>
            )}
          </div>
        </header>

        {err && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {err}
          </div>
        )}

        {/* CARDS RESUMO */}
        <section className="grid md:grid-cols-4 gap-4">
          <Card title="Plano" value={status?.plan || "—"} />
          <Card title="Status" value={status?.status ? status.status.toUpperCase() : "—"} />
          <Card title="Próxima Cobrança" value={status?.nextCharge || "—"} />
          <Card
            title="Último Pagamento"
            value={
              status?.lastPayment
                ? `${status.lastPayment.date} • R$ ${status.lastPayment.amount.toFixed(2)}`
                : "—"
            }
          />
        </section>

        {/* FINANCEIRO + SLUG  (todos os planos) */}
        <section className="rounded-2xl bg-white shadow p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Financeiro & Pagamento</h2>
            <button
              className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              onClick={() => alert("TODO: abrir modal para alterar slug")}
            >
              Alterar slug
            </button>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">ID</th>
                </tr>
              </thead>
              <tbody>
                {(status?.history || []).map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="py-2 pr-4">{h.date}</td>
                    <td className="py-2 pr-4">R$ {h.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{h.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{h.id}</td>
                  </tr>
                ))}
                {(!status?.history || status.history.length === 0) && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>
                      Sem registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* MÍDIAS (todos os planos) */}
        <section className="rounded-2xl bg-white shadow p-6">
          <h2 className="font-semibold mb-6">Banco de Mídias</h2>
          <p className="text-sm text-gray-500 mb-4">
            Substitua as imagens genéricas do seu site. Cada “Mídia #” corresponde a um lugar da
            página (independente do template).
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slots.map((slot) => (
              <MediaCard key={slot.key} slot={slot} onUpload={handleUpload} />
            ))}
          </div>
        </section>

        {/* VIP — CONTADOR DE ACESSOS */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Veja os acessos da sua página em tempo real."
        >
          <h2 className="font-semibold mb-2">Contador de acessos</h2>
          <div className="text-sm text-gray-500 mb-4">Últimos 7 dias</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SmallStat label="Visitas" value="1.248" />
            <SmallStat label="Únicas" value="1.020" />
            <SmallStat label="Tempo médio" value="1m 12s" />
            <SmallStat label="Origem WhatsApp" value="184" />
          </div>
        </Locked>

        {/* VIP — BOTÃO WHATSAPP */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Defina o número que aparece no botão flutuante do seu site."
        >
          <h2 className="font-semibold mb-2">Botão de WhatsApp</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded-xl px-3 py-2" placeholder="(xx) 9xxxx-xxxx" />
            <input className="border rounded-xl px-3 py-2" placeholder="Mensagem padrão (opcional)" />
          </div>
          <div className="mt-3">
            <button className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800">
              Salvar
            </button>
          </div>
        </Locked>

        {/* VIP — RELATÓRIO DE LEADS */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Veja os contatos enviados pela sua landing."
        >
          <h2 className="font-semibold mb-4">Leads recebidos</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Telefone</th>
                  <th className="py-2 pr-4">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { d: "05/09/2025", n: "Ana", t: "(11) 99999-1111", e: "ana@exemplo.com" },
                  { d: "05/09/2025", n: "Bruno", t: "(11) 98888-2222", e: "bruno@exemplo.com" },
                ].map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4">{l.d}</td>
                    <td className="py-2 pr-4">{l.n}</td>
                    <td className="py-2 pr-4">{l.t}</td>
                    <td className="py-2 pr-4">{l.e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Locked>

        {/* VIP — FEEDBACKS */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Avalie mensagens e notas deixadas pelos visitantes."
        >
          <h2 className="font-semibold mb-2">Feedbacks</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <FeedbackCard author="Juliana" stars={5} text="Atendimento excelente!" />
            <FeedbackCard author="Carlos" stars={4} text="Gostei da rapidez no retorno." />
          </div>
        </Locked>

        {/* VIP — EDITOR RÁPIDO */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Edite textos, cores e imagens da sua página."
        >
          <h2 className="font-semibold mb-2">Editor rápido</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded-xl px-3 py-2" placeholder="Título do Hero" />
            <input className="border rounded-xl px-3 py-2" placeholder="Subtítulo do Hero" />
            <input className="border rounded-xl px-3 py-2" placeholder="Cor primária (#hex)" />
            <input className="border rounded-xl px-3 py-2" placeholder="Cor de destaque (#hex)" />
          </div>
          <div className="mt-3">
            <button className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:bg-gray-800">
              Salvar
            </button>
          </div>
        </Locked>

        {/* VIP — RELATÓRIO TRIMESTRAL */}
        <Locked
          locked={locked}
          className="rounded-2xl bg-white shadow p-6"
          hint="Resumo de desempenho do último trimestre."
        >
          <h2 className="font-semibold mb-4">Relatório Trimestral</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <SmallStat label="Visitas" value="9.480" />
            <SmallStat label="Leads" value="356" />
            <SmallStat label="Taxa Conversão" value="3,75%" />
            <SmallStat label="Avaliação Média" value="4.7 ★" />
          </div>
        </Locked>
      </div>
    </div>
  );
}

/** ———————————————————————
 *   SUBCOMPONENTES
 * ——————————————————————— */

function Badge({ label }: { label: string }) {
  return <span className="text-xs rounded-full bg-white shadow px-3 py-1">{label}</span>;
}

function Card({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function MediaCard({
  slot,
  onUpload,
}: {
  slot: MediaSlot;
  onUpload: (slot: MediaSlot, file: File) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="aspect-video bg-gray-100 grid place-items-center">
        {slot.url ? (
          <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">{slot.label} (sem imagem)</span>
        )}
      </div>
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="text-sm">{slot.label}</div>
        <label
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm cursor-pointer ${
            busy ? "bg-gray-200 text-gray-500" : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {busy ? "Enviando…" : "Trocar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                await onUpload(slot, f);
              } catch (err: any) {
                alert(err?.message || "Falha no upload");
              } finally {
                setBusy(false);
                e.currentTarget.value = "";
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

function FeedbackCard({ author, stars, text }: { author: string; stars: number; text: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">{author}</div>
        <div className="text-amber-500 text-sm">{Array.from({ length: stars }).map((_, i) => "★")}</div>
      </div>
      <div className="text-sm text-gray-600 mt-2">{text}</div>
    </div>
  );
}
