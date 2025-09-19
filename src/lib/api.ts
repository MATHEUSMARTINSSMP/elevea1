// Backend nativo - desenvolvimento local ou URL do Replit para produção
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://seu-repl.replit.app'); // Substitua pela URL real do seu Replit

export const APPS_ENDPOINT = API_BASE_URL; // Compatibilidade

export type UploadResp = {
  ok?: boolean;
  error?: string;
  driveFolderUrl?: string;
  saved?: string[];
};
export type CadastroResp = {
  ok?: boolean;
  error?: string;
  errors?: string[];
  siteSlug?: string;
};

export async function postCadastro(payload: any): Promise<CadastroResp> {
  const r = await fetch(`${API_BASE_URL}/api/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  try {
    const result = JSON.parse(text);
    return { 
      ok: result.ok, 
      error: result.error,
      errors: result.error ? [result.error] : [],
      siteSlug: result.site?.siteSlug 
    };
  } catch {
    return { ok: false, errors: ["resposta_nao_json"] };
  }
}

export async function postOnboarding(
  payload: any
): Promise<{ ok?: boolean; error?: string }> {
  const r = await fetch(`${API_BASE_URL}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json().catch(() => ({ ok: false, error: "upstream_not_json" }));
}

/** Upload para o backend nativo */
export async function uploadToDrive(params: {
  email: string;
  siteSlug: string;
  logoLink?: string;
  fotosLink?: string;
  logoFile?: File | null;
  fotoFiles?: FileList | null;
}): Promise<UploadResp> {
  const fd = new FormData();
  fd.set("siteSlug", params.siteSlug);
  fd.set("email", params.email);
  
  // Upload de arquivos para o backend nativo
  if (params.logoFile) fd.append("files", params.logoFile);
  if (params.fotoFiles?.length) {
    Array.from(params.fotoFiles).forEach((f) => fd.append("files", f));
  }

  const r = await fetch(`${API_BASE_URL}/api/assets`, {
    method: "POST",
    body: fd,
  });
  
  const text = await r.text();
  try {
    const result = JSON.parse(text);
    return {
      ok: result.ok,
      error: result.error,
      saved: result.assets?.map((a: any) => a.filename) || [],
      driveFolderUrl: result.assets?.length > 0 ? '/uploads/' + params.siteSlug : undefined
    };
  } catch {
    return { ok: false, error: `Falha ao interpretar resposta (${r.status})` };
  }
}

// === NOVAS FUNÇÕES PARA API NATIVA ===

export async function createLead(data: {
  siteSlug: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}) {
  const r = await fetch(`${API_BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function createFeedback(data: {
  siteSlug: string;
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}) {
  const r = await fetch(`${API_BASE_URL}/api/feedbacks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function recordHit(data: {
  siteSlug: string;
  path?: string;
  metadata?: Record<string, any>;
}) {
  const r = await fetch(`${API_BASE_URL}/api/hit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function getClientPlan(email: string) {
  const r = await fetch(`${API_BASE_URL}/api/client-plan?email=${encodeURIComponent(email)}`);
  return r.json();
}

export async function getClientBilling(email: string) {
  const r = await fetch(`${API_BASE_URL}/api/client-billing?email=${encodeURIComponent(email)}`);
  return r.json();
}

export async function getSiteStatus(siteSlug: string) {
  const r = await fetch(`${API_BASE_URL}/api/status?site=${encodeURIComponent(siteSlug)}`);
  return r.json();
}

export async function getSiteSettings(siteSlug: string) {
  const r = await fetch(`${API_BASE_URL}/api/settings?site=${encodeURIComponent(siteSlug)}`);
  return r.json();
}

export async function getLeads(siteSlug: string, page = 1, pageSize = 20) {
  const r = await fetch(`${API_BASE_URL}/api/leads?site=${encodeURIComponent(siteSlug)}&page=${page}&pageSize=${pageSize}`);
  return r.json();
}

export async function getFeedbacks(siteSlug: string, page = 1, pageSize = 20, onlyPublic = false) {
  const publicParam = onlyPublic ? '&public=1' : '';
  const r = await fetch(`${API_BASE_URL}/api/feedbacks?site=${encodeURIComponent(siteSlug)}&page=${page}&pageSize=${pageSize}${publicParam}`);
  return r.json();
}

export async function getTrafficStats(siteSlug: string, range = '30d') {
  const r = await fetch(`${API_BASE_URL}/api/traffic?site=${encodeURIComponent(siteSlug)}&range=${range}`);
  return r.json();
}

export async function getAssets(siteSlug: string) {
  const r = await fetch(`${API_BASE_URL}/api/assets?site=${encodeURIComponent(siteSlug)}`);
  return r.json();
}
