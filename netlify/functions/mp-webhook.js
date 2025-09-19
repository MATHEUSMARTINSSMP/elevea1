// netlify/functions/mp-webhook.js
const crypto = require("crypto");

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";
const SHEETS_WEBAPP_URL = process.env.SHEETS_WEBAPP_URL || "";

// --- HTTP helper (Node 18/20 tem fetch global) ---
async function mpGet(path) {
  if (!MP_TOKEN) return {}; // sem token, não consulta (evita erro em teste/simulação)
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`MP ${r.status}: ${txt}`);
  }
  return r.json();
}

// --- normaliza tipo e ação (MP pode variar os campos) ---
function getResourceAndAction(body) {
  let resource = body?.type || body?.topic || body?.entity || "";
  if (resource === "subscription_preapproval") resource = "preapproval";
  const action = body?.action || body?.topic || "unknown";
  return { resource, action };
}

// --- valida a assinatura do MP (libera quando sem segredo ou sem cabeçalhos de simulação) ---
function verifyMpSignature(headers) {
  if (!MP_WEBHOOK_SECRET) return true;

  const sig = headers["x-signature"] || headers["X-Signature"];
  const reqId = headers["x-request-id"] || headers["X-Request-Id"];

  // O simulador do MP normalmente não envia assinatura; não bloqueamos nesses casos
  if (!sig || !reqId) return true;

  // x-signature: "ts=1700000000, v1=abcdef..."
  const parts = Object.fromEntries(
    String(sig)
      .split(",")
      .map((p) => p.trim().split("="))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const base = `${reqId}:${ts}`;
  const expected = crypto.createHmac("sha256", MP_WEBHOOK_SECRET).update(base).digest("hex");

  // comparação em tempo constante
  const A = Buffer.from(expected, "hex");
  const B = Buffer.from(v1, "hex");
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

exports.handler = async (event) => {
  try {
    // GET = teste de saúde
    if (event.httpMethod !== "POST") {
      return { statusCode: 200, body: "OK" };
    }

    const headers = event.headers || {};
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {}

    console.log("MP headers ->", headers);
    console.log("MP body    ->", body);

    // valida assinatura (relaxa para simulação sem assinatura)
    const isValid = verifyMpSignature(headers);
    if (!isValid) {
      console.warn("Assinatura inválida.");
      return { statusCode: 401, body: "invalid signature" };
    }

    const { resource, action } = getResourceAndAction(body);
    const id = String(body?.data?.id ?? ""); // força string sempre

    if (!resource || !id) {
      console.warn("Sem resource/id no payload.");
      return { statusCode: 200, body: "ignored" };
    }

    // busca detalhes no MP (se tivermos token)
    let details = {};
    try {
      if (resource === "preapproval") {
        details = await mpGet(`/preapproval/${id}`);
        console.log("PREAPPROVAL DETAIL ->", details);
      } else if (resource === "payment") {
        details = await mpGet(`/v1/payments/${id}`);
        console.log("PAYMENT DETAIL ->", details);
      } else {
        console.log("Resource não tratado:", resource);
      }
    } catch (err) {
      console.error("Erro consultando MP:", err);
    }

    // tenta extrair preapproval_id para facilitar match
    const preapprovalId =
      details?.subscription_id ||
      details?.metadata?.preapproval_id ||
      details?.payer?.preapproval_id ||
      "";

    const payload = {
      ts: new Date().toISOString(),
      event: resource,
      action,
      mp_id: id,
      preapproval_id: preapprovalId,
      status:
        details?.status ||
        details?.status_detail ||
        details?.collection_status ||
        "",
      payer_email:
        details?.payer?.email ||
        details?.payer_email ||
        details?.payer_email_address ||
        "",
      amount:
        details?.transaction_amount ||
        details?.auto_recurring?.transaction_amount ||
        details?.subscription_amount ||
        "",
      raw: details,
    };

    // envia para o Google Sheets (Apps Script), se configurado
    if (SHEETS_WEBAPP_URL) {
      try {
        const r = await fetch(SHEETS_WEBAPP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("Sheets status ->", r.status);
      } catch (err) {
        console.error("Falha ao enviar para Sheets:", err);
      }
    }

    return { statusCode: 200, body: "received" };
  } catch (err) {
    console.error("FATAL webhook error:", err);
    return { statusCode: 500, body: "server error" };
  }
};
