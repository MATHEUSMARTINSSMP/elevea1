export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (
    path.startsWith("/.netlify/") ||
    path.startsWith("/admin/") ||
    path.startsWith("/client/")
  ) {
    return context.next();
  }

  const APPS_URL = context.env?.ELEVEA_STATUS_URL;
  const SLUG = context.env?.ELEVEA_SITE_SLUG;

  if (!APPS_URL || !SLUG) {
    return new Response("Configuração faltando (ELEVEA_STATUS_URL/SLUG)", { status: 500 });
  }

  try {
    const statusUrl = `${APPS_URL}?type=status&site=${encodeURIComponent(SLUG)}`;
    const r = await fetch(statusUrl, { headers: { "cache-control": "no-cache" } });
    const data = await r.json().catch(() => ({}));

    if (!data?.ok) return new Response("Erro ao verificar status", { status: 500 });
    if (data.manualBlock || !data.active) {
      return new Response("Assinatura inativa ou bloqueada. Regularize seu pagamento para reativar o site.", {
        status: 402,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return context.next();
  } catch (err) {
    return new Response("Falha na verificação: " + String(err), { status: 500 });
  }
};
