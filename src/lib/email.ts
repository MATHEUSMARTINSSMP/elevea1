// src/lib/email.ts

async function sendEmail(payload: { to: string; subject: string; html: string }) {
  const r = await fetch("/.netlify/functions/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.ok === false) {
    console.error("Erro ao enviar email:", data?.error || r.status);
    throw new Error(data?.error || "Falha no envio de email");
  }
  return data;
}

export async function sendWelcomeEmail(email: string) {
  return sendEmail({
    to: email,
    subject: "Bem-vindo à Elevea 🚀",
    html: `
      <div style="font-family:sans-serif;line-height:1.5;">
        <h2>Bem-vindo(a)!</h2>
        <p>Estamos muito felizes em ter você conosco.</p>
        <p>Explore sua conta e aproveite todos os recursos disponíveis.</p>
        <p><b>Equipe Elevea</b></p>
      </div>
    `,
  });
}

export async function sendCustomEmail(to: string, subject: string, html: string) {
  return sendEmail({ to, subject, html });
}
