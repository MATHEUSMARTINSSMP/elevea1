export const APPS_ENDPOINT =
  import.meta.env.VITE_APPS_WEBAPP_URL ||
  import.meta.env.ELEVEA_GAS_URL ||
  "https://script.google.com/macros/s/AKfycbxPbvLefGLGZJXLBXeXYtSOWVl7gQwl3G0v1NTVDovBiPW5J_yTm_a-3v6nOXh5D6NNBQ/exec";

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
  const r = await fetch("/.netlify/functions/submit-cadastro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, errors: ["resposta_nao_json"] };
  }
}

export async function postOnboarding(
  payload: any
): Promise<{ ok?: boolean; error?: string }> {
  const r = await fetch("/.netlify/functions/submit-onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json().catch(() => ({ ok: false, error: "upstream_not_json" }));
}

/** Upload multipart → proxy Netlify → GAS */
export async function uploadToDrive(params: {
  email: string;
  siteSlug: string;
  logoLink?: string;
  fotosLink?: string;
  logoFile?: File | null;
  fotoFiles?: FileList | null;
}): Promise<UploadResp> {
  const fd = new FormData();
  fd.set("email", params.email);
  fd.set("siteSlug", params.siteSlug);
  if (params.logoLink) fd.set("logoLink", params.logoLink);
  if (params.fotosLink) fd.set("fotosLink", params.fotosLink);
  if (params.logoFile) fd.set("logo", params.logoFile);
  if (params.fotoFiles?.length)
    Array.from(params.fotoFiles).forEach((f) => fd.append("fotos", f));

  const r = await fetch("/.netlify/functions/upload-drive", {
    method: "POST",
    body: fd, // NÃO definir Content-Type manualmente
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `Falha ao interpretar resposta (${r.status})` };
  }
}
