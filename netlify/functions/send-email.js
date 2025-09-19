// netlify/functions/send-email.js
// Envio de e-mail via Resend API.
//
// ENVs obrigatórias: RESEND_API_KEY, RESEND_FROM
// Opcional: SITE_BASE_URL (usado quando template === "reset")

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "";
const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://eleveaagencia.netlify.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    if (!RESEND_API_KEY || !RESEND_FROM) {
      return resp(500, { ok: false, error: "missing_resend_env" });
    }

    const body = JSON.parse(event.body || "{}");
    let { to, subject, html, template } = body;

    // Template opcional: reset
    if (template === "reset") {
      const token = String(body.token || "");
      const email = String(body.email || body.to || "");
      if (!email || !token) {
        return resp(400, { ok: false, error: "missing_email_or_token" });
      }
      to = email;
      const link = `${SITE_BASE_URL}/reset?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
      subject = "Redefinição de senha - Elevea";
      html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;">
          <h2>Redefinição de senha</h2>
          <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
          <p><a href="${link}" target="_blank" style="display:inline-block;padding:.6rem 1rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Definir nova senha</a></p>
          <p style="word-break:break-all;color:#555;">${link}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="color:#888;font-size:12px;">Se você não solicitou, pode ignorar este e-mail.</p>
        </div>
      `;
    }

    if (!to || !subject || !html) {
      return resp(400, { ok: false, error: "missing_params" });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Elevea <${RESEND_FROM}>`,
        to,
        subject,
        html,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return resp(r.status, { ok: false, error: data });
    }

    return resp(200, { ok: true, data });
  } catch (err) {
    return resp(500, { ok: false, error: String(err) });
  }
};

function resp(statusCode, body) {
  return { statusCode, headers: cors, body: JSON.stringify(body) };
}
