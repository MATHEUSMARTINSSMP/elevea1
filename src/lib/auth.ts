// src/lib/auth.ts

/**
 * Solicita reset de senha.
 * O backend (/.netlify/functions/reset-dispatch) dispara e-mail com o link.
 */
export async function requestPasswordReset(email: string) {
  const r = await fetch("/.netlify/functions/reset-dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "password_reset_request", email }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.ok === false) {
    throw new Error(data?.error || "Falha ao solicitar reset");
  }
  return data;
}

/**
 * Confirma reset de senha (define nova senha).
 */
export async function confirmPasswordReset(email: string, token: string, password: string) {
  const r = await fetch("/.netlify/functions/reset-dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "password_reset_confirm", email, token, password }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.ok === false) {
    throw new Error(data?.error || "Falha ao confirmar reset");
  }
  return data;
}
