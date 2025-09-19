// netlify/functions/reset-dispatch.js
// Reset de senha via Apps Script + Resend.
// Tipos:
//  - POST { type:"password_reset_request", email }
//  - POST { type:"password_reset_confirm", email, token, password }
//
// ENVs:
//  - VITE_APPS_WEBAPP_URL (ou SHEETS_WEBAPP_URL): URL do GAS (/exec)
//  - SITE_BASE_URL: ex. https://eleveaagencia.netlify.app
//  - RESEND_API_KEY, RESEND_FROM: envio de e-mail

const APPS_URL =
  process.env.VITE_APPS_WEBAPP_URL || process.env.SHEETS_WEBAPP_URL || "";
const SITE_BASE_URL =
  process.env.SITE_BASE_URL || "https://eleveaagencia.netlify.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "";
const IS_PROD =
  (process.env.CONTEXT || process.env.NODE_ENV) === "production" &&
  !process.env.NETLIFY_LOCAL;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: cors, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return resp(405, { ok: false, error: "method_not_allowed" });
    }
    if (!APPS_URL) {
      return resp(500, { ok: false, error: "missing_VITE_APPS_WEBAPP_URL" });
    }

    const body = JSON.parse(event.body || "{}");
    const type = String(body.type || "");
    if (!type) return resp(400, { ok: false, error: "missing_type" });

    // chama GAS
    const gr = await fetch(APPS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const gdata = await gr.json().catch(() => ({}));
    if (!gr.ok || gdata.ok === false) {
      return resp(gr.status || 500, gdata.ok === false ? gdata : { ok: false, error: "upstream_error" });
    }

    // solicitar reset → gera token e envia e-mail
    if (type === "password_reset_request") {
      const email = String(body.email || "");
      const token = gdata.token || "";
      if (!email || !token) {
        return resp(500, { ok: false, error: "missing_email_or_token" });
      }

      const link = `${SITE_BASE_URL}/reset?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

      if (RESEND_API_KEY && RESEND_FROM) {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: email,
            subject: "Redefinição de senha - Elevea",
            html: `
              <div style="font-family:sans-serif;line-height:1.5;">
                <h2>Redefinição de Senha</h2>
                <p>Olá,</p>
                <p>Recebemos um pedido para redefinir a sua senha.</p>
                <p>
                  <a href="${link}" style="display:inline-block;padding:.6rem 1rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Definir nova senha</a>
                </p>
                <p style="word-break:break-all;color:#555;">${link}</p>
                <p style="color:#888;font-size:12px;">Se você não solicitou, ignore este e-mail.</p>
              </div>
            `,
          }),
        });

        if (!r.ok) {
          const txt = await r.text();
          console.error("Resend failed:", txt);
          return resp(200, { ok: true, sent: false, ...(IS_PROD ? {} : { debugLink: link }) });
        }

        return resp(200, { ok: true, sent: true, ...(IS_PROD ? {} : { debugLink: link }) });
      }

      // Sem Resend configurado → modo dev
      return resp(200, { ok: true, sent: false, ...(IS_PROD ? {} : { debugLink: link }) });
    }

    // confirmar reset → só repassa a resposta do GAS
    if (type === "password_reset_confirm") {
      return resp(200, gdata);
    }

    return resp(400, { ok: false, error: "unknown_type" });
  } catch (err) {
    console.error(err);
    return resp(500, { ok: false, error: String(err) });
  }
};

function resp(statusCode, body) {
  return { statusCode, headers: cors, body: JSON.stringify(body) };
}
