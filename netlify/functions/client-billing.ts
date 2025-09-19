// netlify/functions/client-billing.ts
const json = (status: number, body: any) => ({
  statusCode: status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  try {
    const GAS = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || "";

    const email =
      (event.queryStringParameters && event.queryStringParameters.email) ||
      (event.body ? (JSON.parse(event.body).email || "") : "");

    if (!GAS) return json(500, { ok: false, error: "missing_GAS_BASE_URL" });
    if (!email) return json(400, { ok: false, error: "missing_email" });

    const r = await fetch(GAS, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "client_billing", email }),
    });

    const out = await r.json().catch(() => ({}));
    return json(200, out);
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message || e) });
  }
};
