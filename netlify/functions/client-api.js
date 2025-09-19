// netlify/functions/client-api.js
// Proxy entre o frontend e o seu Apps Script.
//
// GETs
//  ?action=get_settings&site=SLUG
//  ?action=list_leads&site=SLUG&page=1&size=20
//  ?action=list_feedbacks&site=SLUG&page=1&size=20
//  ?action=get_traffic&site=SLUG&range=30d
//
// POSTs (JSON)
//  action=save_settings   { site, settings, pin? }
//  action=record_hit      { site, meta }
//  action=create_lead     { site, name, email, phone, extra? }
//  action=create_feedback { site, rating, comment, name?, email? }
//  action=feedback_set_approval { site, id, approved, pin }
//
// Requer no Netlify: GAS_BASE_URL=https://script.google.com/macros/s/XXXX/exec
const GAS_BASE_URL = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || process.env.SHEETS_WEBAPP_URL || "";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT", // Added PUT for assets
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };
}

exports.handler = async (event) => {
  const headers = cors();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (!GAS_BASE_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "missing_GAS_BASE_URL" }),
    };
  }

  try {
    // ===== GETs =====
    if (event.httpMethod === "GET") {
      const qs = event.queryStringParameters || {};
      const action = String(qs.action || "").toLowerCase();
      const site = String(qs.site || "").trim().toUpperCase();
      if (!site) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: "missing_site" }),
        };
      }

      if (action === "get_settings") {
        const url = `${GAS_BASE_URL}?type=get_settings&site=${encodeURIComponent(site)}`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "list_leads") {
        const page = Number(qs.page || 1) || 1;
        const size = Number(qs.size || 20) || 20;
        const url = `${GAS_BASE_URL}?type=list_leads&site=${encodeURIComponent(site)}&page=${page}&pageSize=${size}`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "list_feedbacks") {
        const page = Number(qs.page || 1) || 1;
        const size = Number(qs.size || 20) || 20;
        const url = `${GAS_BASE_URL}?type=list_feedbacks&site=${encodeURIComponent(site)}&page=${page}&pageSize=${size}`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "get_traffic") {
        const range = String(qs.range || "30d");
        const url = `${GAS_BASE_URL}?type=get_traffic&site=${encodeURIComponent(site)}&range=${encodeURIComponent(range)}`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "get_status") {
        const url = `${GAS_BASE_URL}?type=status&site=${encodeURIComponent(site)}`;
        const r = await fetch(url);
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "unknown_action_get" }),
      };
    }

    // ===== POSTs =====
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const action = String(body.action || "").toLowerCase();

      if (action === "save_settings") {
        const site = String(body.site || "").trim().toUpperCase();
        if (!site || typeof body.settings !== "object") {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "missing_site_or_settings" }) };
        }
        const r = await fetch(`${GAS_BASE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "save_settings", 
            site: site, 
            settings: body.settings, 
            pin: body.pin 
          }),
        });
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "record_hit") {
        const site = String(body.site || "").trim().toUpperCase();
        const meta = body.meta || {};
        if (!site) {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "missing_site" }) };
        }
        const r = await fetch(`${GAS_BASE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "record_hit", 
            site: site, 
            path: meta.path || "/",
            ip: meta.ip || "",
            userAgent: meta.userAgent || ""
          }),
        });
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "create_lead") {
        const site = String(body.site || "").trim().toUpperCase();
        if (!site) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"missing_site" }) };
        const r = await fetch(`${GAS_BASE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lead_new",
            site: site,
            name: body.name || "",
            email: body.email || "",
            phone: body.phone || "",
            source: body.source || "site"
          }),
        });
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "create_feedback") {
        const site = String(body.site || "").trim().toUpperCase();
        if (!site) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"missing_site" }) };
        const r = await fetch(`${GAS_BASE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "feedback_new",
            site: site,
            rating: body.rating,
            comment: body.comment || "",
            name: body.name || "",
            email: body.email || "",
            phone: body.phone || ""
          }),
        });
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      if (action === "feedback_set_approval") {
        const site = String(body.site || "").trim().toUpperCase();
        if (!site) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"missing_site" }) };
        const r = await fetch(`${GAS_BASE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "feedback_set_approval",
            site: site,
            id: body.id,
            approved: body.approved,
            pin: body.pin
          }),
        });
        const j = await r.json().catch(() => ({}));
        return { statusCode: 200, headers, body: JSON.stringify(j) };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "unknown_action_post" }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
