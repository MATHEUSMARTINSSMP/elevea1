// netlify/functions/admin-toggle.js
// Bloqueio/reativação manual via painel Elevea + registro no GAS

const json = (code, body, extraHeaders = {}) => ({
  statusCode: code,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-elevea-internal",
    "Cache-Control": "no-store",
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" }, { Allow: "POST,OPTIONS" });
  }

  // ====== ENV ======
  // ELEVEA_STATUS_URL aceita padrão com {site} OU você pode usar SITES_MAP_JSON
  // Ex.: ELEVEA_STATUS_URL = https://{site}.netlify.app
  const basePattern = process.env.ELEVEA_STATUS_URL || "";               // ex: https://{site}.netlify.app
  const adminDashToken = process.env.ADMIN_DASH_TOKEN || "";             // token do painel
  const syncToken = process.env.ADMIN_SYNC_TOKEN_FOR_CLIENTS || "";      // token aceito pelo status-write dos SITES
  const gasUrl = process.env.ELEVEA_GAS_URL || "";                       // URL do Apps Script Web App (exec)

  if (!syncToken) return json(500, { ok: false, error: "ADMIN_SYNC_TOKEN_FOR_CLIENTS not set" });
  if (!gasUrl)    return json(500, { ok: false, error: "ELEVEA_GAS_URL not set" });

  // ====== AUTH (painel) ======
  const auth = event.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const internal = (event.headers["x-elevea-internal"] || event.headers["X-Elevea-Internal"]) === "1";

  if (adminDashToken && !(internal || bearer === adminDashToken)) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  // ====== BODY ======
  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const { action, siteSlug, block } = body;
  if (!action || !siteSlug || typeof block !== "boolean") {
    return json(400, {
      ok: false,
      error: "missing_params",
      need: ["action", "siteSlug", "block:boolean"],
    });
  }

  // block:true => active:false
  const active = !block;
  const site = String(siteSlug || "").toUpperCase();

  // ====== Resolve origin do cliente ======
  let origin = null;

  let sitesMap = null;
  if (process.env.SITES_MAP_JSON) {
    try { sitesMap = JSON.parse(process.env.SITES_MAP_JSON); } catch {}
  }
  if (sitesMap && sitesMap[site]) {
    origin = String(sitesMap[site]);
  } else if (basePattern) {
    if (!basePattern.includes("{site}")) {
      return json(500, { ok: false, error: "ELEVEA_STATUS_URL must contain {site} or set SITES_MAP_JSON" });
    }
    origin = basePattern.replace("{site}", site);
  }
  if (!origin) return json(500, { ok: false, error: "No origin found (ELEVEA_STATUS_URL/SITES_MAP_JSON)" });

  origin = origin.replace(/\/+$/, "");
  const clientStatusWrite = `${origin}/.netlify/functions/status-write`;

  // ====== 1) AVISA O SITE DO CLIENTE (Blob / status-write) ======
  let siteRespPayload = null;
  try {
    const res = await fetch(clientStatusWrite, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${syncToken}`,
      },
      body: JSON.stringify({
        site,
        action,         // "manual-block" ou similar
        active,         // false quando block === true
        updatedBy: "admin@elevea",
        ts: Date.now(),
      }),
    });

    const text = await res.text();
    try { siteRespPayload = JSON.parse(text); } catch { siteRespPayload = { raw: text }; }

    if (!res.ok) {
      // segue para o GAS mesmo se falhar aqui
      console.warn("status-write upstream_error", res.status, siteRespPayload);
    }
  } catch (e) {
    console.warn("status-write fetch_failed", String(e));
  }

  // ====== 2) AVISA O GAS (planilha: admin_set) — sempre tentamos ======
  let gasRespPayload = null;
  try {
    // Usar GET com parâmetros na URL conforme o GAS espera
    const params = new URLSearchParams({
      type: "admin_set",
      token: adminDashToken,
      site: site,
      manualBlock: block ? "1" : "0"
    });
    
    const resG = await fetch(`${gasUrl}?${params}`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    const textG = await resG.text();
    try { gasRespPayload = JSON.parse(textG); } catch { gasRespPayload = { raw: textG }; }

    if (!resG.ok) {
      return json(resG.status, {
        ok: false,
        error: "gas_upstream_error",
        details: gasRespPayload,
        siteStatusWrite: siteRespPayload || null,
      });
    }
  } catch (e) {
    return json(502, {
      ok: false,
      error: "gas_fetch_failed",
      detail: String(e),
      siteStatusWrite: siteRespPayload || null,
    });
  }

  // ====== OK final ======
  return json(200, {
    ok: true,
    siteSlug: site,
    active,
    siteStatusWrite: siteRespPayload || null,
    gas: gasRespPayload || null,
  });
};
