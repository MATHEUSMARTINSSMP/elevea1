// netlify/functions/subscription-status.ts
// Consolida o status do cliente para o DASHBOARD
// Chama diretamente o GAS para obter informações de status

export const handler = async (event: any) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "GET") {
      return json(405, { ok: false, error: "method_not_allowed" });
    }

    const qs = event.queryStringParameters || {};
    const site = String(qs.site || "").trim();
    const email = String(qs.email || "").trim().toLowerCase();
    
    if (!site) {
      return json(400, { ok: false, error: "missing_site" });
    }

    const GAS_BASE_URL = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || "";
    if (!GAS_BASE_URL) {
      return json(500, { ok: false, error: "missing_gas_url" });
    }

    const gasUrl = `${GAS_BASE_URL}?type=status&site=${encodeURIComponent(site)}`;
    const response = await fetch(gasUrl);
    const data = await response.json();

    return json(200, data);
  } catch (error) {
    console.error("Error in subscription-status:", error);
    return json(500, { ok: false, error: "internal_error" });
  }
};

function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
