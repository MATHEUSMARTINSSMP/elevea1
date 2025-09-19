// /netlify/functions/submit-cadastro.js
// Encaminha o CADASTRO para o Apps Script (doPost) usando a URL do seu WebApp.

const APPS_URL =
  process.env.ELEVEA_STATUS_URL || process.env.SHEETS_WEBAPP_URL || "";

exports.handler = async (event) => {
  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: baseHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: baseHeaders,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  }

  if (!APPS_URL) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ ok: false, error: "ELEVEA_STATUS_URL_not_set" }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    if (payload?.type !== "cadastro") {
      return {
        statusCode: 400,
        headers: baseHeaders,
        body: JSON.stringify({ ok: false, error: "invalid_type" }),
      };
    }

    const r = await fetch(APPS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: text === "ok-evento" }; }

    return { statusCode: 200, headers: baseHeaders, body: JSON.stringify(data) };
  } catch (err) {
    console.error("submit-cadastro error:", err);
    return { statusCode: 500, headers: baseHeaders, body: JSON.stringify({ ok: false, error: "server_error" }) };
  }
};
