// /netlify/functions/submit-onboarding.js
// Encaminha o ONBOARDING para o Apps Script (doPost).

const APPS_URL =
  process.env.ELEVEA_STATUS_URL ||
  process.env.SHEETS_WEBAPP_URL ||
  process.env.VITE_APPS_WEBAPP_URL ||
  "";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: JSON.stringify({ ok:false, error:"method_not_allowed" }) };

  if (!APPS_URL)
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error:"missing_apps_url" }) };

  try {
    const payload = JSON.parse(event.body || "{}");
    if (payload?.type !== "onboarding")
      return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"invalid_type" }) };

    // Convert to GAS expected format
    const gasPayload = {
      type: "save_onboarding",
      site: payload.siteSlug || payload.site,
      email: payload.email,
      whatsapp: payload.phone || payload.whatsapp,
      empresa: payload.company || payload.empresa,
      endereco: payload.address || payload.endereco,
      historia: payload.about || payload.historia,
      produtos: payload.services || payload.produtos,
      fundacao: payload.founded || payload.fundacao,
      paletteId: payload.palette || payload.paletteId,
      templateId: payload.template || payload.templateId,
      logoUrl: payload.logoUrl,
      fotosUrls: payload.photos || payload.fotosUrls || [],
      plano: payload.plan || "essential",
      drive_folder_url: payload.driveFolderUrl
    };

    const r = await fetch(APPS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gasPayload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok:false, error:"upstream_not_json" }; }

    return { statusCode: r.ok ? 200 : (r.status || 500), headers, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error:String(e) }) };
  }
};
