// netlify/functions/gas-proxy.ts
import type { Handler } from "@netlify/functions";

const GAS_URL = process.env.APPS_WEBAPP_URL || process.env.SHEETS_WEBAPP_URL;

export const handler: Handler = async (event) => {
  try {
    if (!GAS_URL) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: "missing_gas_url" }) };
    }

    if (event.httpMethod === "GET") {
      const qs = event.rawQuery ? `?${event.rawQuery}` : "";
      const resp = await fetch(`${GAS_URL}${qs}`, { headers: { Accept: "application/json" } });
      const text = await resp.text();
      return { statusCode: resp.status, body: text, headers: { "content-type": "application/json" } };
    }

    // POST → repassa body como está (evita CORS no browser)
    const resp = await fetch(GAS_URL, {
      method: "POST",
      body: event.body,
      headers: { "content-type": "application/json", Accept: "application/json" },
    });
    const text = await resp.text();
    return { statusCode: resp.status, body: text, headers: { "content-type": "application/json" } };
  } catch (e: any) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: e?.message || "proxy_error" }) };
  }
};
