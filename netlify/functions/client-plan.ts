// netlify/functions/client-plan.ts
// Consolida o status do cliente para o DASHBOARD
// Chama diretamente o GAS para obter informações de status e billing

const json = (status: number, body: any) => ({
  statusCode: status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

function looksVip(plan: string): boolean {
  if (!plan) return false;
  const p = String(plan).toLowerCase().trim();
  return p.includes("vip") || p.includes("premium") || p.includes("pro");
}

function isActiveStatus(status: string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === "active" || s === "ativo" || s === "activo";
}

export const handler = async (event: any) => {
  try {
    const qs = event.queryStringParameters || {};
    const site = String(qs.site || "").trim();
    const email = String(qs.email || "").trim().toLowerCase();
    
    if (!site || !email) {
      return json(400, { ok: false, error: "missing_params" });
    }

    const GAS_BASE_URL = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || "";
    if (!GAS_BASE_URL) {
      return json(500, { ok: false, error: "missing_gas_url" });
    }

    // Chama diretamente o GAS para obter status e billing
    const [statusRes, billingRes] = await Promise.allSettled([
      fetch(`${GAS_BASE_URL}?type=status&site=${encodeURIComponent(site)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(GAS_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "client_billing", email }),
      }),
    ]);

    const statusData = statusRes.status === "fulfilled" ? await statusRes.value.json().catch(() => ({})) : {};
    const billingData = billingRes.status === "fulfilled" ? await billingRes.value.json().catch(() => ({})) : {};

    const plan = billingData.plan || "";
    const status = statusData.status || billingData.status || "";
    const nextCharge = billingData.next_renewal || null;
    const lastPayment = billingData.last_payment ? {
      date: billingData.last_payment,
      amount: billingData.amount || 0
    } : null;

    // Determina se é VIP baseado em múltiplas fontes
    const vip = looksVip(plan) || isActiveStatus(status) || statusData.active;

    return json(200, {
      ok: true,
      vip,
      plan: vip ? "vip" : (plan || ""),
      status,
      nextCharge,
      lastPayment,
    });
  } catch (e: any) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
};
