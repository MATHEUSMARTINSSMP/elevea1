// netlify/functions/auth-session.js  (Edge)

const readEnv = (k) =>
  (typeof Netlify !== "undefined" && Netlify?.env?.get?.(k)) ||
  (typeof process !== "undefined" && process.env?.[k]) ||
  "";

const APPS_WEBAPP_URL  = readEnv("VITE_APPS_WEBAPP_URL"); // GAS /exec
const ADMIN_DASH_TOKEN = readEnv("ADMIN_DASH_TOKEN");

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extra,
    },
  });
}
function noContent(extra = {}) { return new Response("", { status: 204, headers: extra }); }
function setCookie(name, val, maxAgeSec, extra = "") {
  let c = `${name}=${val}; Path=/; HttpOnly; SameSite=Lax${extra ? `; ${extra}` : ""}`;
  if (maxAgeSec != null) c += `; Max-Age=${maxAgeSec}`;
  return c;
}
function getCookie(req, key) {
  const s = req.headers.get("cookie") || "";
  const m = s.match(new RegExp(`(?:^|; )${key}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}
async function hmac(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,"0")).join("");
}
const b64u = s => btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const b64uJSON = o => b64u(JSON.stringify(o));
async function makeToken(payload) {
  const h = b64uJSON({ alg:"HS256", typ:"JWT" });
  const p = b64uJSON(payload);
  const s = await hmac(ADMIN_DASH_TOKEN, `${h}.${p}`);
  return `${h}.${p}.${s}`;
}
async function verifyToken(tok) {
  const [h,p,s] = (tok || "").split(".");
  if (!h || !p || !s) return null;
  const exp = await hmac(ADMIN_DASH_TOKEN, `${h}.${p}`);
  if (exp !== s) return null;
  try { return JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/"))); } catch { return null; }
}
async function gasPost(body) {
  if (!APPS_WEBAPP_URL) return { ok:false, error:"VITE_APPS_WEBAPP_URL ausente" };
  const r = await fetch(APPS_WEBAPP_URL, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify(body),
    cf: { cacheTtl: 0 }
  });
  return r.json();
}

export default async function handler(req) {
  const url = new URL(req.url);
  const action = (url.searchParams.get("action") || "").toLowerCase();

  // CORS
  if (req.method === "OPTIONS") {
    return noContent({
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    });
  }

  if (action === "ping") {
    return json({ ok:true, runtime:"edge", now: Date.now(), hasEnv: !!APPS_WEBAPP_URL });
  }

  if (action === "login" && req.method === "POST") {
    if (!APPS_WEBAPP_URL) return json({ ok:false, error:"VITE_APPS_WEBAPP_URL ausente" }, 500);
    if (!ADMIN_DASH_TOKEN) return json({ ok:false, error:"ADMIN_DASH_TOKEN ausente" }, 500);

    const { email, password } = await req.json();
    const emailLc = String(email||"").trim().toLowerCase();
    if (!emailLc || !password) return json({ ok:false, error:"E-mail e senha obrigatórios" }, 400);

    // 1) valida credenciais no GAS
    const rLogin = await gasPost({ type:"user_login", email: emailLc, password });
    if (!rLogin?.ok) return json({ ok:false, error:"Credenciais inválidas" }, 401);

    // 2) lê perfil no GAS
    const rMe = await gasPost({ type:"user_me", email: emailLc });
    if (!rMe?.ok) return json({ ok:false, error:"Usuário não encontrado" }, 401);

    const role = String(rMe.role||"").toLowerCase();
    const siteSlug = role === "admin" ? null : (rMe.siteSlug || null);
    const payload = { email: emailLc, role, siteSlug, plan: rMe.plan || "essential", ts: Date.now() };

    const token = await makeToken(payload);
    const cookie = setCookie("elevea_sess", token, 60*60*24*30, "Secure"); // 30d

    return json({ ok:true, user: payload }, 200, { "set-cookie": cookie });
  }

  if (action === "logout") {
    const cookie = setCookie("elevea_sess", "", 0, "Secure");
    return json({ ok:true }, 200, { "set-cookie": cookie });
  }

  if (action === "me") {
    const raw = getCookie(req, "elevea_sess");
    if (!raw) return json({ ok:false, error:"Sem sessão" }, 401);
    const payload = await verifyToken(raw);
    if (!payload) return json({ ok:false, error:"Sessão inválida" }, 401);
    return json({ ok:true, user: payload });
  }

  return json({ ok:false, error:`Ação inválida: ${action}` }, 400);
}

export const config = { runtime: "edge" };
