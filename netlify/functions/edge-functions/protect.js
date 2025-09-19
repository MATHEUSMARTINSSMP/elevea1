// netlify/edge-functions/protect.js
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Só protege /admin/* e /client/*
  const isAdmin = path.startsWith("/admin/");
  const isClient = path.startsWith("/client/");
  if (!isAdmin && !isClient) {
    return context.next(); // páginas públicas: "/" inclusive
  }

  // Lê cookie
  const rawCookie = request.headers.get("cookie") || "";
  const cookie = Object.fromEntries(
    rawCookie.split(/;\s*/).filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    })
  );
  const token = cookie["elevea_sess"] || "";

  // Segredo HMAC
  const SIGN_SECRET = context.env?.ADMIN_DASH_TOKEN || context.env?.ADMIN_TOKEN || "";
  if (!SIGN_SECRET) {
    return new Response("Missing signing secret", { status: 500 });
  }

  const timingSafeEqual = (a, b) => {
    const A = new TextEncoder().encode(a || "");
    const B = new TextEncoder().encode(b || "");
    if (A.length !== B.length) return false;
    let ok = 0;
    for (let i = 0; i < A.length; i++) ok |= A[i] ^ B[i];
    return ok === 0;
  };

  const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  const sign = async (payload) => {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SIGN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return b64url(mac);
  };

  const parseToken = async (tkn) => {
    if (!tkn || !tkn.includes(".")) return null;
    const [payload, sig] = tkn.split(".");
    const expected = await sign(payload);
    if (!timingSafeEqual(expected, sig)) return null;
    try {
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (!json.exp || Date.now() > json.exp) return null;
      return json;
    } catch {
      return null;
    }
  };

  const claims = await parseToken(token);
  const goLogin = () =>
    Response.redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`, 302);

  if (!claims) return goLogin();

  // Autorização por role
  const role = String(claims.role || "");
  if (isAdmin && role !== "admin") return new Response("Forbidden", { status: 403 });
  if (isClient && !(role === "client" || role === "admin")) return goLogin();

  // Encaminha com cabeçalhos úteis
  const newHeaders = new Headers(request.headers);
  newHeaders.set("x-user-email", claims.email || "");
  newHeaders.set("x-user-role", role);
  newHeaders.set("x-user-site", claims.siteSlug || "");

  return context.next({ request: new Request(request, { headers: newHeaders }) });
};
