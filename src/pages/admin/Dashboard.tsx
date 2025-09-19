// src/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";

/** Endpoints (Netlify Functions do PAINEL Elevea) */
const APPS_ENDPOINT = "/.netlify/functions/sheets-proxy";
const ADMIN_TOGGLE_FN = "/.netlify/functions/admin-toggle";
const CLIENT_API = "/.netlify/functions/sheets-proxy"; // já é o APPS_ENDPOINT (reuso)

/** ===== Tipos ===== */
type SiteStatus = {
  ok: boolean;
  active: boolean;
  manualBlock?: boolean;
  status?: string; // approved/authorized/... (billing)
  preapproval_id?: string;
  email?: string;
  updatedAt?: string | number;
};

type Row = { siteSlug: string; status: SiteStatus | null };
type Filter = "all" | "active" | "blocked" | "inactive";

type Billing = {
  ok: boolean;
  plan?: "vip" | "essential";
  status?: string;
  provider?: string;
  next_renewal?: string;
  amount?: number;
  currency?: string;
  error?: string;
};

type Lead = { ts: string; name: string; email: string; phone: string; source: string };
type Feedback = { ts: string; name: string; rating: number; comment: string };
type TrafficPoint = { day: string; hits: number };

/** ===== Helpers visuais ===== */
function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "amber";
}) {
  const map: Record<string, string> = {
    neutral: "bg-gray-100 text-gray-700 border border-gray-200",
    green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    red: "bg-rose-100 text-rose-700 border border-rose-200",
    amber: "bg-amber-100 text-amber-800 border border-amber-200",
  };
  return (
    <span className={cls("px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1", map[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}
function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }
) {
  const { className, variant = "solid", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl text-sm px-3.5 py-2.5 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    solid: "bg-black text-white hover:bg-gray-900",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100 text-gray-800",
  } as const;
  return <button className={cls(base, variants[variant], className)} {...rest} />;
}
function Icon({
  name,
  className = "",
}: {
  name: "refresh" | "lock" | "unlock" | "download" | "search";
  className?: string;
}) {
  const m: Record<string, string> = {
    refresh: "M4 4v4m0-4h4M4 8l4-4m8 12v-4m0 4h-4m4-4-4 4M4 16h4m8-8h4",
    lock: "M6 10V8a4 4 0 1 1 8 0v2m-9 0h10v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6z",
    unlock: "M15 10V8a4 4 0 0 0-8 0m-1 2h10v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z",
    download: "M12 3v10m0 0 3-3m-3 3-3-3M5 17h14",
    search: "M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm11 3-6-6",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls("h-4 w-4", className)}>
      <path d={m[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function fmtDate(s?: string | number) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR");
  } catch {
    return String(s);
  }
}

/** ====== CSV util ====== */
function downloadCSV(filename: string, rows: any[]) {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const lines = [header.join(","), ...rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join(
    "\n"
  );
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Pequeno debounce (para busca) */
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** ====== Page ====== */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string>("");

  // side drawers por site
  const [openSlug, setOpenSlug] = useState<string>(""); // qual linha está “expandida”
  const [billing, setBilling] = useState<Record<string, Billing | null>>({});
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>({});
  const [traffic, setTraffic] = useState<Record<string, TrafficPoint[]>>({});
  const [busy, setBusy] = useState<string>(""); // slug “busy”
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(t: "ok" | "err", msg: string) {
    setToast({ type: t, msg });
    setTimeout(() => setToast(null), 3200);
  }

  async function reload() {
    setLoading(true);
    setError("");
    try {
      // Buscar lista de sites
      const r = await fetch(`/.netlify/functions/admin-sites?nc=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Falha ao listar sites (HTTP ${r.status})`);
      const data = await r.json();
      const slugs: string[] = (data?.siteSlugs || []).filter(Boolean);

      const statusList: Row[] = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const s = await fetch(`${APPS_ENDPOINT}?type=status&site=${encodeURIComponent(slug)}&nc=${Date.now()}`, {
              cache: "no-store",
            });
            if (!s.ok) throw new Error(`Falha status ${slug} (HTTP ${s.status})`);
            const sj: SiteStatus = await s.json();
            return { siteSlug: slug, status: sj };
          } catch (e) {
            console.error(e);
            return { siteSlug: slug, status: null };
          }
        })
      );

      setRows(statusList);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar dados.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toUpperCase();
    return rows.filter((r) => {
      const st = r.status;
      const matchesQuery =
        !q ||
        r.siteSlug.toUpperCase().includes(q) ||
        (st?.email || "").toUpperCase().includes(q) ||
        (st?.preapproval_id || "").toUpperCase().includes(q);

      let matchesFilter = true;
      if (filter === "active") matchesFilter = !!(st?.ok && st?.active && !st?.manualBlock);
      if (filter === "blocked") matchesFilter = !!st?.manualBlock;
      if (filter === "inactive") matchesFilter = !!(st?.ok && !st?.active);

      return matchesQuery && matchesFilter;
    });
  }, [rows, debouncedQuery, filter]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status?.ok && r.status?.active && !r.status?.manualBlock).length;
    const blocked = rows.filter((r) => r.status?.manualBlock).length;
    const inactive = rows.filter((r) => r.status?.ok && !r.status?.active).length;
    return { total, active, blocked, inactive };
  }, [rows]);

  async function toggleBlock(slug: string, next: boolean) {
    try {
      setBusy(slug);
      const rr = await fetch(ADMIN_TOGGLE_FN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-elevea-internal": "1",
        },
        body: JSON.stringify({ action: "manual-block", siteSlug: slug, block: !!next }),
      });
      if (!rr.ok) {
        const text = await rr.text().catch(() => "");
        throw new Error(`HTTP ${rr.status} - ${text || "admin-toggle falhou"}`);
      }
      showToast("ok", next ? "Site bloqueado" : "Site reativado");
      await reload();
    } catch (e: any) {
      console.error(e);
      showToast("err", e?.message || "Falha ao alternar bloqueio.");
      alert(e?.message || "Falha ao alternar bloqueio.");
    } finally {
      setBusy("");
    }
  }

  async function loadDrill(slug: string, email?: string) {
    setOpenSlug((s) => (s === slug ? "" : slug));
    if (openSlug && openSlug === slug) return; // fechando

    try {
      // Billing - usar client-billing function
      if (email) {
        const br = await fetch(`/.netlify/functions/client-billing?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });
        const bj: Billing = await br.json();
        setBilling((prev) => ({ ...prev, [slug]: bj }));
      }
      
      // Leads - usar client-api
      {
        const lr = await fetch(
          `/.netlify/functions/client-api?action=list_leads&site=${encodeURIComponent(slug)}&page=1&size=100&nc=${Date.now()}`,
          { cache: "no-store" }
        );
        const lj = await lr.json();
        setLeads((prev) => ({ ...prev, [slug]: (lj?.items || []) as Lead[] }));
      }
      
      // Feedbacks - usar client-api
      {
        const fr = await fetch(
          `/.netlify/functions/client-api?action=list_feedbacks&site=${encodeURIComponent(slug)}&page=1&size=100&nc=${Date.now()}`,
          { cache: "no-store" }
        );
        const fj = await fr.json();
        setFeedbacks((prev) => ({ ...prev, [slug]: (fj?.items || []) as Feedback[] }));
      }
      
      // Traffic - usar client-api
      {
        const tr = await fetch(
          `/.netlify/functions/client-api?action=get_traffic&site=${encodeURIComponent(slug)}&range=30d&nc=${Date.now()}`,
          { cache: "no-store" }
        );
        const tj = await tr.json();
        setTraffic((prev) => ({ ...prev, [slug]: (tj?.daily || []) as TrafficPoint[] }));
      }
    } catch (e) {
      console.error(e);
      showToast("err", "Alguns relatórios não puderam ser carregados.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 py-10 px-5 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Painel Elevea · Assinaturas</h1>
            <p className="text-slate-600 mt-1">Status, bloqueios e relatórios (financeiro, leads, feedbacks, tráfego).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload} disabled={loading}>
              <Icon name="refresh" className={cls(loading && "animate-spin")} />{" "}
              <span className="ml-2">{loading ? "Atualizando" : "Atualizar"}</span>
            </Button>
          </div>
        </div>

        {!!error && (
          <div className="rounded-xl border bg-white p-3 text-sm text-rose-700">
            <div className="font-medium">Erro</div>
            <div className="opacity-80">{error}</div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total" value={kpis.total} />
          <KpiCard title="Ativos" value={kpis.active} />
          <KpiCard title="Bloqueados" value={kpis.blocked} />
          <KpiCard title="Inativos" value={kpis.inactive} />
        </div>

        {/* Filtros + busca */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative w-full md:w-[28rem]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full border rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-black/70"
              placeholder="Buscar por site, e-mail ou preapproval_id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "blocked", "inactive"] as Filter[]).map((f) => (
              <Button key={f} variant={filter === f ? "solid" : "outline"} onClick={() => setFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 sticky top-0">
              <tr>
                <Th>Site</Th>
                <Th>Status</Th>
                <Th>Pagamento</Th>
                <Th>E-mail</Th>
                <Th>Preapproval</Th>
                <Th>Atualizado</Th>
                <Th className="text-center">Bloq. manual</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = r.status;
                const tone = !st?.ok ? "amber" : st?.manualBlock ? "red" : st?.active ? "green" : "neutral";
                const label = !st?.ok ? "erro" : st?.manualBlock ? "bloqueado" : st?.active ? "ativo" : "inativo";

                return (
                  <React.Fragment key={r.siteSlug}>
                    <tr className="border-t hover:bg-slate-50/70">
                      <Td className="font-medium">{r.siteSlug}</Td>
                      <Td>
                        <Badge tone={tone as any}>{label}</Badge>
                      </Td>
                      <Td>{st?.status || "—"}</Td>
                      <Td className="max-w-[16rem] truncate">{st?.email || "—"}</Td>
                      <Td className="max-w-[12rem] truncate">{st?.preapproval_id || "—"}</Td>
                      <Td>{fmtDate(st?.updatedAt)}</Td>
                      <Td className="text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-black"
                          checked={!!st?.manualBlock}
                          onChange={(e) => toggleBlock(r.siteSlug, e.target.checked)}
                          disabled={busy === r.siteSlug}
                          aria-label={`Bloqueio manual de ${r.siteSlug}`}
                        />
                      </Td>
                      <Td className="text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" onClick={() => loadDrill(r.siteSlug, st?.email)}>
                          Relatórios
                        </Button>
                        <Button
                          onClick={() => toggleBlock(r.siteSlug, !st?.manualBlock)}
                          disabled={busy === r.siteSlug}
                          className={cls(
                            st?.manualBlock ? "bg-emerald-600 hover:bg-emerald-700" : "bg-black hover:bg-gray-900",
                            "text-white"
                          )}
                        >
                          {st?.manualBlock ? (
                            <span className="inline-flex items-center gap-2">
                              <Icon name="unlock" /> Reativar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Icon name="lock" /> Bloquear
                            </span>
                          )}
                        </Button>
                      </Td>
                    </tr>

                    {/* Drawer da linha */}
                    {openSlug === r.siteSlug && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={8} className="px-4 py-6">
                          <RowDetails
                            slug={r.siteSlug}
                            email={st?.email}
                            billing={billing[r.siteSlug] ?? null}
                            leads={leads[r.siteSlug] ?? []}
                            feedbacks={feedbacks[r.siteSlug] ?? []}
                            traffic={traffic[r.siteSlug] ?? []}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={8}>
                    {loading ? "Carregando..." : "Nenhum resultado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cls(
            "fixed bottom-4 right-4 rounded-xl px-4 py-3 shadow-lg",
            toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/** ====== Sub-componentes ====== */
function KpiCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-5 border">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}
function Th({ children, className = "" }: any) {
  return <th className={cls("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide", className)}>{children}</th>;
}
function Td({ children, className = "" }: any) {
  return <td className={cls("px-4 py-3 align-top", className)}>{children}</td>;
}

function RowDetails({
  slug,
  email,
  billing,
  leads,
  feedbacks,
  traffic,
}: {
  slug: string;
  email?: string;
  billing: Billing | null;
  leads: Lead[];
  feedbacks: Feedback[];
  traffic: TrafficPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Financeiro */}
      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Financeiro</h3>
          <button onClick={() => billing && downloadCSV(`${slug}-billing.csv`, [billing])} className="text-xs underline" disabled={!billing}>
            <span className="inline-flex items-center gap-1">
              <Icon name="download" /> CSV
            </span>
          </button>
        </div>
        {!billing ? (
          <div className="text-sm text-slate-500 mt-2">Carregando...</div>
        ) : billing.ok ? (
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <b>Plano:</b> {billing.plan}
            </li>
            <li>
              <b>Status:</b> {billing.status}
            </li>
            <li>
              <b>Próx. renovação:</b> {fmtDate(billing.next_renewal)}
            </li>
            <li>
              <b>Valor:</b> {billing.amount} {billing.currency}
            </li>
            <li>
              <b>Provedor:</b> {billing.provider}
            </li>
          </ul>
        ) : (
          <div className="text-sm text-rose-700 mt-2">Erro ao carregar: {billing.error || "desconhecido"}</div>
        )}
        {!!email && <div className="text-xs text-slate-500 mt-3">E-mail: {email}</div>}
      </section>

      {/* Leads */}
      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Leads (últimos)</h3>
        </div>
        <div className="mt-2 space-y-2 max-h-60 overflow-auto pr-1">
          {(!leads || leads.length === 0) && <div className="text-sm text-slate-500">Sem leads.</div>}
          {leads?.slice(0, 8).map((l, i) => (
            <div key={i} className="text-sm">
              <div className="font-medium">
                {l.name || "(sem nome)"} <span className="text-slate-500">· {l.source || "-"}</span>
              </div>
              <div className="text-slate-600">
                {l.email || "-"} · {l.phone || "-"}
              </div>
              <div className="text-xs text-slate-500">{fmtDate(l.ts)}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Configuração de Sessões (schema por site) */}
<section className="rounded-xl border bg-white p-4">
  <h3 className="font-semibold">Configuração de Sessões (schema)</h3>
  <SchemaEditor slug={slug} />
</section>

      {/* Feedbacks + Tráfego */}
      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Feedbacks</h3>
        </div>
        <div className="mt-2 space-y-2 max-h-40 overflow-auto pr-1">
          {(!feedbacks || feedbacks.length === 0) && <div className="text-sm text-slate-500">Sem feedbacks.</div>}
          {feedbacks?.slice(0, 6).map((f, i) => (
            <div key={i} className="text-sm">
              <div className="font-medium">
                {f.name || "(anônimo)"} · ⭐ {f.rating}
              </div>
              <div className="text-slate-700">{f.comment || "-"}</div>
              <div className="text-xs text-slate-500">{fmtDate(f.ts)}</div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-1">Tráfego (30d)</h4>
          <TrafficBars points={traffic} />
        </div>
      </section>
    </div>
  );
}

function TrafficBars({ points }: { points: TrafficPoint[] }) {
  if (!points?.length) return <div className="text-sm text-slate-500">Sem dados.</div>;
  const max = Math.max(...points.map((p) => p.hits), 1);
  return (
    <div className="flex items-end gap-1 h-28">
      {points.slice(-20).map((p) => (
        <div key={p.day} className="flex-1 bg-slate-200 rounded-sm" title={`${p.day}: ${p.hits}`}>
          <div className="bg-black w-full rounded-sm" style={{ height: `${Math.max(6, (p.hits / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

function SchemaEditor({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [jsonText, setJsonText] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/.netlify/functions/client-api?action=get_settings&site=${encodeURIComponent(slug)}&nc=${Date.now()}`, {
        cache: "no-store",
      });
      const j = await r.json();
      const defs = j?.settings?.sections?.defs || [];
      setJsonText(JSON.stringify(defs, null, 2));
    } catch {
      setJsonText("[]");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function save() {
    try {
      const parsed = JSON.parse(jsonText || "[]");
      const rr = await fetch("/.netlify/functions/client-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_settings",
          site: slug,
          settings: { sections: { defs: parsed } }, // mantemos data existente como está
        }),
      });
      if (!rr.ok) throw new Error(`HTTP ${rr.status}`);
      alert("Schema salvo com sucesso.");
    } catch (e: any) {
      alert(e?.message || "Falha ao salvar schema.");
    }
  }

  return (
    <div className="mt-2">
      {loading ? (
        <div className="text-sm text-slate-500">Carregando…</div>
      ) : (
        <>
          <div className="text-xs text-slate-600 mb-2">
            Edite o <b>array</b> de sessões. Exemplo rápido:
            <pre className="mt-2 bg-slate-50 border rounded p-2 overflow-auto">
{`[
  {
    "id": "hero",
    "name": "Sessão: Hero",
    "fields": [
      { "key": "title", "label": "Título" },
      { "key": "subtitle", "label": "Subtítulo" }
    ],
    "slots": [
      { "key": "hero_img_1", "label": "Foto 1" },
      { "key": "hero_img_2", "label": "Foto 2" }
    ]
  }
]`}
            </pre>
          </div>
          <textarea
            className="w-full h-56 border rounded p-2 font-mono text-xs"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button onClick={load} className="border rounded px-3 py-1.5 text-sm">Recarregar</button>
            <button onClick={save} className="bg-black text-white rounded px-3 py-1.5 text-sm">Salvar schema</button>
          </div>
        </>
      )}
    </div>
  );
}

