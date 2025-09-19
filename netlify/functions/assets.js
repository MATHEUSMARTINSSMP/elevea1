// netlify/functions/assets.js
// Proxy para assets do GAS (listar e upload)

const GAS_BASE_URL = process.env.GAS_BASE_URL || process.env.ELEVEA_GAS_EXEC_URL || process.env.SHEETS_WEBAPP_URL || "";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
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
    const qs = event.queryStringParameters || {};
    const site = String(qs.site || "").trim().toUpperCase();

    if (!site) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "missing_site" }),
      };
    }

    // GET: listar assets
    if (event.httpMethod === "GET") {
      const url = `${GAS_BASE_URL}?type=assets&site=${encodeURIComponent(site)}`;
      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      return { statusCode: 200, headers, body: JSON.stringify(j) };
    }

    // PUT: upload de arquivo (multipart)
    if (event.httpMethod === "PUT") {
      const formData = new FormData();
      
      // Parse multipart form data
      const boundary = event.headers['content-type']?.split('boundary=')[1];
      if (!boundary) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: "invalid_content_type" }),
        };
      }

      const body = event.body;
      const parts = body.split(`--${boundary}`);
      
      let siteSlug = "";
      let section = "";
      let key = "";
      let file = null;

      for (const part of parts) {
        if (part.includes('name="site"')) {
          const match = part.match(/name="site"\r?\n\r?\n(.+?)\r?\n/);
          if (match) siteSlug = match[1].trim().toUpperCase();
        } else if (part.includes('name="section"')) {
          const match = part.match(/name="section"\r?\n\r?\n(.+?)\r?\n/);
          if (match) section = match[1].trim();
        } else if (part.includes('name="key"')) {
          const match = part.match(/name="key"\r?\n\r?\n(.+?)\r?\n/);
          if (match) key = match[1].trim();
        } else if (part.includes('name="file"')) {
          const match = part.match(/name="file"; filename="(.+?)"\r?\nContent-Type: (.+?)\r?\n\r?\n(.+?)$/s);
          if (match) {
            const filename = match[1];
            const contentType = match[2];
            const content = match[3];
            
            // Convert to base64 for GAS
            const base64 = Buffer.from(content, 'binary').toString('base64');
            file = {
              name: filename,
              mime: contentType,
              b64: base64
            };
          }
        }
      }

      if (!siteSlug || !file) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: "missing_site_or_file" }),
        };
      }

      // Send to GAS
      const r = await fetch(GAS_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload_base64",
          siteSlug: siteSlug,
          email: qs.email || "unknown@example.com", // fallback
          fotos: [file] // GAS expects array
        }),
      });

      const j = await r.json().catch(() => ({}));
      
      // Return the first saved file URL if available
      if (j.ok && j.saved && j.saved.length > 0) {
        // Try to get the URL from assets list
        const assetsUrl = `${GAS_BASE_URL}?type=assets&site=${encodeURIComponent(siteSlug)}`;
        const assetsRes = await fetch(assetsUrl);
        const assetsData = await assetsRes.json().catch(() => ({}));
        
        if (assetsData.ok && assetsData.items && assetsData.items.length > 0) {
          const lastItem = assetsData.items[assetsData.items.length - 1];
          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
              ok: true, 
              url: lastItem.url,
              key: key,
              saved: j.saved 
            }) 
          };
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify(j) };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "method_not_allowed" }),
    };
  } catch (e) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ ok: false, error: String(e) }) 
    };
  }
};