// netlify/functions/admin-sites.js
// Lista sites para o dashboard administrativo

const GAS_BASE_URL = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || process.env.SHEETS_WEBAPP_URL || "";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-elevea-internal",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };
}

exports.handler = async (event) => {
  const headers = cors();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  }

  if (!GAS_BASE_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "missing_GAS_BASE_URL" }),
    };
  }

  try {
    // Como o GAS não tem endpoint 'sites', vamos tentar buscar de uma planilha
    // ou usar uma lista hardcoded. Por enquanto, vamos usar uma lista de exemplo
    const sites = [
      "TESTE1",
      "TESTE2", 
      "TESTE3",
      "EXEMPLO1",
      "EXEMPLO2"
    ];

    // TODO: Implementar busca real de sites do GAS quando disponível
    // const r = await fetch(`${GAS_BASE_URL}?type=sites`);
    // const data = await r.json();
    // const sites = data?.siteSlugs || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        siteSlugs: sites,
        total: sites.length
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        ok: false, 
        error: `admin-sites error: ${e && e.message ? e.message : String(e)}` 
      }),
    };
  }
};
